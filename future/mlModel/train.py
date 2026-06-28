"""
train.py — SE Defense ML Model Training Script

Uses scikit-learn to train a text classification model to detect
social engineering / phishing messages.

Dataset: dataset.csv  (columns: text, label)
  label 0 = benign
  label 1 = social engineering / phishing

Model: TF-IDF + Logistic Regression pipeline (fast, interpretable baseline)
Output: model.pkl (serialised sklearn Pipeline)
"""

import os
import sys
import pickle
import warnings
import pandas as pd
import numpy as np

from sklearn.pipeline          import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model      import LogisticRegression
from sklearn.model_selection   import train_test_split, cross_val_score
from sklearn.metrics           import (
    classification_report, confusion_matrix, roc_auc_score
)

warnings.filterwarnings('ignore')

# ── Configuration ─────────────────────────────────────────────────────────────
DATASET_PATH = os.path.join(os.path.dirname(__file__), 'dataset.csv')
MODEL_PATH   = os.path.join(os.path.dirname(__file__), 'model.pkl')
RANDOM_STATE = 42
TEST_SIZE    = 0.20

def load_dataset(path: str) -> pd.DataFrame:
    """Load and validate the training dataset."""
    if not os.path.exists(path):
        print(f"[!] Dataset not found at {path}. Generating synthetic demo data…")
        return generate_demo_dataset()

    df = pd.read_csv(path)
    required = {'text', 'label'}
    if not required.issubset(df.columns):
        print(f"[!] Dataset must have columns: {required}. Got: {df.columns.tolist()}")
        sys.exit(1)

    df.dropna(subset=['text', 'label'], inplace=True)
    df['text']  = df['text'].astype(str)
    df['label'] = df['label'].astype(int)
    return df


def generate_demo_dataset() -> pd.DataFrame:
    """
    Generates a small synthetic dataset for demonstration.
    Replace with a real labelled dataset for production use.
    """
    phishing = [
        "URGENT: Your account has been compromised. Click here to verify.",
        "IRS: You owe $3,200. Respond immediately or face arrest.",
        "Congratulations! You won $1,000,000. Send your bank details now.",
        "Your PayPal account is suspended. Confirm identity: http://paypa1.com/verify",
        "Act now! Your subscription expires today. Update billing info here.",
        "Security Alert: Unusual login detected. Reset your password immediately.",
        "Final notice: Your credit card will be charged. Cancel here within 24 hrs.",
        "FBI Notice: Your IP was linked to illegal activity. Click to clear charges.",
    ] * 15  # repeat for volume

    benign = [
        "Hi John, let's meet tomorrow for the project review.",
        "Your package has shipped! Estimated delivery: Tuesday.",
        "Monthly newsletter: Top tips for staying healthy this summer.",
        "Reminder: Your appointment is scheduled for 3pm on Friday.",
        "Thank you for your purchase! Your order #12345 is confirmed.",
        "Team update: Sprint planning is at 10am Monday in the main boardroom.",
        "Password successfully changed. If this wasn't you, contact support.",
        "Your invoice for this month is ready. Log in to view it.",
    ] * 15

    texts  = phishing + benign
    labels = [1] * len(phishing) + [0] * len(benign)

    df = pd.DataFrame({'text': texts, 'label': labels}).sample(frac=1, random_state=RANDOM_STATE)
    return df


def build_pipeline() -> Pipeline:
    """Constructs the sklearn ML pipeline."""
    return Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=20_000,
            sublinear_tf=True,
            min_df=2,
            strip_accents='unicode',
        )),
        ('clf', LogisticRegression(
            C=1.0,
            solver='lbfgs',
            max_iter=1000,
            random_state=RANDOM_STATE,
            class_weight='balanced',
        )),
    ])


def train():
    print("=" * 60)
    print("  SE Defense — ML Model Training")
    print("=" * 60)

    # Load data
    df = load_dataset(DATASET_PATH)
    print(f"\n📊 Dataset: {len(df)} samples | "
          f"Phishing: {df['label'].sum()} | "
          f"Benign: {(df['label'] == 0).sum()}")

    X, y = df['text'].values, df['label'].values

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    print(f"   Train: {len(X_train)} | Test: {len(X_test)}")

    # Build & train
    print("\n⚙️  Training TF-IDF + Logistic Regression pipeline…")
    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    # Evaluate
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]
    auc    = roc_auc_score(y_test, y_prob)

    print("\n📈 Evaluation on test set:")
    print(classification_report(y_test, y_pred, target_names=['Benign', 'Phishing']))
    print(f"ROC-AUC: {auc:.4f}")
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    # Cross-validation
    cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring='f1')
    print(f"\n5-Fold CV F1: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # Save
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(pipeline, f)
    print(f"\n✅ Model saved to {MODEL_PATH}")

    # Quick inference test
    samples = [
        "URGENT: Your bank account is compromised! Verify now: http://secure-bank.tk",
        "Hi! Just checking in — are we still on for lunch tomorrow?",
    ]
    print("\n🔍 Quick inference test:")
    for s in samples:
        prob = pipeline.predict_proba([s])[0, 1]
        label = "🚨 PHISHING" if prob > 0.5 else "✅ BENIGN"
        print(f"   [{label}] ({prob:.2%}) → \"{s[:60]}…\"")


if __name__ == '__main__':
    train()
