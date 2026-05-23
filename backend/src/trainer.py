# backend/src/trainer.py
import os
import random
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

def generate_synthetic_indian_dataset(output_path: str, samples_per_category: int = 350) -> pd.DataFrame:
    """
    Generates a highly realistic dataset of Indian bank statement transaction narratives
    with artificial variations in capitalization, transactional structures, and noise.
    """
    print("📋 Engineering synthetic Indian transaction dataset tokens...")
    
    narrative_templates = [
        "UPI/CR/{id}/DEBIT/{merchant}/",
        "UPI/DR/{id}/{merchant}@oksbi/Payment",
        "POS/WID/{id}/{merchant}/MUMBAI",
        "POS/DR/{merchant}/BANGALORE",
        "ACH/DR/{merchant}/EMIPAYMENT",
        "IMPS-{id}-{merchant}-BANKTRANSFER",
        "NET BANKING/DR/{merchant}/TRANSFER",
        "BIL/ONL/{id}/{merchant}/INTERNET"
    ]

    domain_categories = {
        "Food & Dining": ["ZOMATO", "SWIGGY", "STARBUCKS", "MC DONALDS", "DOMINOS", "CHAI POINT", "BBINSTAMART", "ZEPTO", "BLINKIT", "EATFIT"],
        "Shopping": ["AMAZON", "FLIPKART", "MYNTRA", "AJIO", "NYKAA", "CROMA", "RELIANCE DIGITAL", "DMART", "URBANIC", "ZUDIO"],
        "Travel & Fuel": ["OLA CABS", "UBER INDIA", "MAKEMYTRIP", "IRCTC", "RAPIDO", "HP CL", "BPCL", "INDIANOIL", "INDIGO", "METRO RECHARGE"],
        "Utilities & Bills": ["BESCOM", "RELIANCE ENERGY", "AIRTEL BILL", "JIO RECHARGE", "ACT FIBERNET", "TATA PLAY", "DTH DIST", "BESCOM_BANGALORE"],
        "Investment & EMIs": ["ZERODHA", "GROWW", "INDMONEY", "HDFC EMIPAY", "SBI LOAN DEBIT", "MUTUAL FUND ACH", "COIN_DCX", "CRED_CLUB"],
        "Salary & Income": ["SALARY CREDITED", "NEFT_INWARD/CORP", "MONTHLY SALARY", "PAYROLL INTERNAL", "INTEREST CREDITED", "DIVIDEND INWARD"],
        "Subscriptions": ["NETFLIX", "SPOTIFY", "AMAZON PRIME", "HOTSTAR", "BOOKMYSHOW", "SONYLIV", "YOUTUBE PREMIUM", "APPLE ONE"]
    }

    dataset = []

    for category, merchants in domain_categories.items():
        for _ in range(samples_per_category):
            merchant = random.choice(merchants)
            tx_id = random.randint(1000000000, 9999999999)
            
            if category == "Salary & Income":
                template = "NEFT/INWARD/{id}/{merchant}" if random.random() > 0.5 else "IMPS/INWARD/{id}/{merchant}"
            else:
                template = random.choice(narrative_templates)
            
            case_roll = random.random()
            if case_roll > 0.66:
                merchant = merchant.lower()
            elif case_roll > 0.33:
                merchant = merchant.title()
                
            narration = template.format(id=tx_id, merchant=merchant)
            dataset.append({"narration": narration, "category": category})

    df = pd.DataFrame(dataset)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"✅ Dataset file written containing {len(df)} entries at: {output_path}")
    return df

def train_custom_pipeline():
    """
    Constructs, trains, evaluates, and exports the scikit-learn NLP categorization model.
    """
    data_path = os.path.join("backend", "data", "raw", "transactions.csv")
    model_dir = os.path.join("backend", "models")
    model_path = os.path.join(model_dir, "transaction_categorizer.pkl")
    
    if not os.path.exists(data_path):
        df = generate_synthetic_indian_dataset(data_path)
    else:
        df = pd.read_csv(data_path)

    X = df['narration']
    y = df['category']
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )

    nlp_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 3), lowercase=True, analyzer='char_wb')),
        ('classifier', LogisticRegression(max_iter=1000, C=5.0))
    ])

    print("⚡ Executing model fitting over vectorized feature matrix...")
    nlp_pipeline.fit(X_train, y_train)
    
    y_pred = nlp_pipeline.predict(X_test)
    print("\n📊 Local Validation Metrics Matrix:")
    print(classification_report(y_test, y_pred))

    os.makedirs(model_dir, exist_ok=True)
    joblib.dump(nlp_pipeline, model_path)
    print(f"📦 Custom categorization engine successfully packaged at: {model_path}\n")

if __name__ == "__main__":
    train_custom_pipeline()