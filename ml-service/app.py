from flask import Flask, request, jsonify
from flask_cors import CORS
import praw  # Reddit API wrapper
from transformers import pipeline

app = Flask(__name__)
CORS(app)

# Pre-trained sentiment/mental health model from HuggingFace
classifier = pipeline("text-classification",
    model="j-hartmann/emotion-english-distilroberta-base")

# Reddit API setup (free at reddit.com/prefs/apps)
reddit = praw.Reddit(
    client_id="YOUR_CLIENT_ID",
    client_secret="YOUR_SECRET",
    user_agent="mental_health_detector"
)

@app.route('/analyze', methods=['POST'])
def analyze():
    username = request.json.get('username')
    
    try:
        user = reddit.redditor(username)
        comments = []
        for comment in user.comments.new(limit=10):
            comments.append(comment.body)
        
        if not comments:
            return jsonify({"error": "No comments found"}), 404
        
        # Analyze each comment
        results = [classifier(c[:512])[0] for c in comments]
        
        # Aggregate results
        labels = [r['label'] for r in results]
        scores = [r['score'] for r in results]
        
        concern_count = sum(1 for l in labels if 'depression' in l.lower() or 'anxiety' in l.lower())
        risk_level = "High" if concern_count >= 6 else "Medium" if concern_count >= 3 else "Low"
        
        return jsonify({
            "username": username,
            "comments_analyzed": len(comments),
            "risk_level": risk_level,
            "concern_score": round((concern_count / len(comments)) * 100),
            "results": [{"text": comments[i][:100]+"...", "label": results[i]['label'], "score": round(results[i]['score']*100)} for i in range(len(results))]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001)