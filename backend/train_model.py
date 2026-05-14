import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pickle
import os

print("Generating training data...")

np.random.seed(42)
n = 1000

departments = ["Sales", "Research & Development", "Human Resources", "Marketing", "Finance", "IT"]
job_roles = ["Sales Executive", "Research Scientist", "Laboratory Technician", "Manager",
             "Healthcare Representative", "Manufacturing Director", "Human Resources", "Developer", "Analyst"]
genders = ["Male", "Female"]

data = {
    "Age": np.random.randint(22, 60, n),
    "Gender": np.random.choice(genders, n),
    "Department": np.random.choice(departments, n),
    "MonthlyIncome": np.random.randint(2000, 20000, n),
    "JobRole": np.random.choice(job_roles, n),
    "YearsAtCompany": np.random.randint(0, 30, n),
    "WorkLifeBalance": np.random.randint(1, 5, n),
    "JobSatisfaction": np.random.randint(1, 5, n),
    "OverTime": np.random.choice(["Yes", "No"], n, p=[0.3, 0.7]),
}

# Generate attrition based on realistic rules
attrition = []
for i in range(n):
    score = 0
    if data["OverTime"][i] == "Yes": score += 35
    if data["JobSatisfaction"][i] <= 2: score += 25
    if data["MonthlyIncome"][i] < 4000: score += 20
    if data["WorkLifeBalance"][i] <= 2: score += 12
    if data["YearsAtCompany"][i] < 2: score += 10
    if data["Age"][i] < 28: score += 6
    prob = min(0.9, score / 100)
    attrition.append(1 if np.random.random() < prob else 0)

data["Attrition"] = attrition
df = pd.DataFrame(data)

# Encode categoricals
le_gender = LabelEncoder()
le_dept = LabelEncoder()
le_role = LabelEncoder()
le_ot = LabelEncoder()

df["Gender_enc"] = le_gender.fit_transform(df["Gender"])
df["Department_enc"] = le_dept.fit_transform(df["Department"])
df["JobRole_enc"] = le_role.fit_transform(df["JobRole"])
df["OverTime_enc"] = le_ot.fit_transform(df["OverTime"])

features = ["Age", "Gender_enc", "Department_enc", "MonthlyIncome",
            "JobRole_enc", "YearsAtCompany", "WorkLifeBalance",
            "JobSatisfaction", "OverTime_enc"]

X = df[features]
y = df["Attrition"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training Random Forest model...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

accuracy = model.score(X_test, y_test)
print(f"Model accuracy: {accuracy:.2%}")

# Save model and encoders
artifacts = {
    "model": model,
    "le_gender": le_gender,
    "le_dept": le_dept,
    "le_role": le_role,
    "le_ot": le_ot,
    "features": features
}

with open("model.pkl", "wb") as f:
    pickle.dump(artifacts, f)

print("model.pkl saved successfully!")
