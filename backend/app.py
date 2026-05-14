from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
import os

app = FastAPI(title="Attrix ML Backend", version="1.0.0")

# Allow frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
MODEL_PATH = "model.pkl"
artifacts = None

def load_model():
    global artifacts
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            artifacts = pickle.load(f)
        print("Model loaded successfully!")
    else:
        print("WARNING: model.pkl not found. Run train_model.py first!")

load_model()

class PredictionInput(BaseModel):
    age: int
    gender: str
    department: str
    monthlyIncome: float
    jobRole: str
    yearsAtCompany: int
    workLifeBalance: int
    jobSatisfaction: int
    overTime: str
    name: str = ""

class PredictionFactor(BaseModel):
    label: str
    impact: float

class PredictionResult(BaseModel):
    riskLevel: str
    confidence: float
    factors: list[PredictionFactor]
    mainConcern: str

@app.get("/")
def root():
    return {"message": "Attrix ML Backend is running!", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": artifacts is not None}

@app.post("/predict", response_model=PredictionResult)
def predict(data: PredictionInput):
    if artifacts is None:
        # Fallback rule-based if model not loaded
        return rule_based_predict(data)

    try:
        model = artifacts["model"]
        le_gender = artifacts["le_gender"]
        le_dept = artifacts["le_dept"]
        le_role = artifacts["le_role"]
        le_ot = artifacts["le_ot"]

        # Encode inputs safely
        def safe_encode(encoder, value):
            if value in encoder.classes_:
                return encoder.transform([value])[0]
            return 0

        gender_enc = safe_encode(le_gender, data.gender)
        dept_enc = safe_encode(le_dept, data.department)
        role_enc = safe_encode(le_role, data.jobRole)
        ot_enc = safe_encode(le_ot, data.overTime)

        X = np.array([[
            data.age,
            gender_enc,
            dept_enc,
            data.monthlyIncome,
            role_enc,
            data.yearsAtCompany,
            data.workLifeBalance,
            data.jobSatisfaction,
            ot_enc
        ]])

        proba = model.predict_proba(X)[0]
        attrition_prob = proba[1]  # probability of leaving

        # Determine risk level
        if attrition_prob >= 0.6:
            riskLevel = "high"
        elif attrition_prob >= 0.35:
            riskLevel = "medium"
        else:
            riskLevel = "low"

        confidence = round(max(proba) * 100, 1)

        # Build factors
        factors = []
        overtime_impact = 35 if data.overTime == "Yes" else 5
        factors.append({"label": "Overtime", "impact": overtime_impact})

        sat_impact = 25 if data.jobSatisfaction <= 2 else (12 if data.jobSatisfaction == 3 else 5)
        factors.append({"label": "Job Satisfaction", "impact": sat_impact})

        income_impact = 22 if data.monthlyIncome < 4000 else (14 if data.monthlyIncome < 8000 else 6)
        factors.append({"label": "Monthly Income", "impact": income_impact})

        wlb_impact = 14 if data.workLifeBalance <= 2 else 8
        factors.append({"label": "Work Life Balance", "impact": wlb_impact})

        tenure_impact = 12 if data.yearsAtCompany < 2 else (8 if data.yearsAtCompany < 5 else 4)
        factors.append({"label": "Years at Company", "impact": tenure_impact})

        factors.sort(key=lambda x: x["impact"], reverse=True)

        # Main concern
        mainConcern = "Stable profile"
        if data.overTime == "Yes" and data.jobSatisfaction <= 2:
            mainConcern = "Overtime + Low Satisfaction"
        elif data.overTime == "Yes":
            mainConcern = "Frequent Overtime"
        elif data.monthlyIncome < 4000:
            mainConcern = "Low Monthly Income"
        elif data.workLifeBalance <= 2:
            mainConcern = "Poor Work Life Balance"
        elif data.jobSatisfaction <= 2:
            mainConcern = "Low Job Satisfaction"
        elif data.yearsAtCompany < 2:
            mainConcern = "Short Tenure"

        return PredictionResult(
            riskLevel=riskLevel,
            confidence=confidence,
            factors=[PredictionFactor(**f) for f in factors],
            mainConcern=mainConcern
        )

    except Exception as e:
        print(f"Prediction error: {e}")
        return rule_based_predict(data)


def rule_based_predict(data: PredictionInput) -> PredictionResult:
    score = 0
    factors = []

    ot_impact = 35 if data.overTime == "Yes" else 5
    if data.overTime == "Yes": score += 35
    factors.append(PredictionFactor(label="Overtime", impact=ot_impact))

    sat_impact = 25 if data.jobSatisfaction <= 2 else (12 if data.jobSatisfaction == 3 else 5)
    if data.jobSatisfaction <= 2: score += 25
    factors.append(PredictionFactor(label="Job Satisfaction", impact=sat_impact))

    inc_impact = 22 if data.monthlyIncome < 4000 else (14 if data.monthlyIncome < 8000 else 6)
    if data.monthlyIncome < 4000: score += 20
    factors.append(PredictionFactor(label="Monthly Income", impact=inc_impact))

    wlb_impact = 14 if data.workLifeBalance <= 2 else 8
    if data.workLifeBalance <= 2: score += 12
    factors.append(PredictionFactor(label="Work Life Balance", impact=wlb_impact))

    ten_impact = 12 if data.yearsAtCompany < 2 else (8 if data.yearsAtCompany < 5 else 4)
    if data.yearsAtCompany < 2: score += 10
    factors.append(PredictionFactor(label="Years at Company", impact=ten_impact))

    if data.age < 28: score += 6

    riskLevel = "high" if score >= 55 else ("medium" if score >= 28 else "low")
    confidence = round(min(95, max(70, 70 + score * 0.4)), 1)
    factors.sort(key=lambda x: x.impact, reverse=True)

    mainConcern = "Stable profile"
    if data.overTime == "Yes" and data.jobSatisfaction <= 2:
        mainConcern = "Overtime + Low Satisfaction"
    elif data.overTime == "Yes":
        mainConcern = "Frequent Overtime"
    elif data.monthlyIncome < 4000:
        mainConcern = "Low Monthly Income"
    elif data.workLifeBalance <= 2:
        mainConcern = "Poor Work Life Balance"
    elif data.jobSatisfaction <= 2:
        mainConcern = "Low Job Satisfaction"
    elif data.yearsAtCompany < 2:
        mainConcern = "Short Tenure"

    return PredictionResult(
        riskLevel=riskLevel,
        confidence=confidence,
        factors=factors,
        mainConcern=mainConcern
    )
