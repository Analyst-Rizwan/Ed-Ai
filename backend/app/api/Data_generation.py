import pandas as pd
import numpy as np
import random

# Set a seed for reproducibility
np.random.seed(42)

# Define the number of rows
num_rows = 200

# Define categories based on the standard Loan Prediction dataset
genders = ['Male', 'Female']
married_status = ['Yes', 'No']
dependents = ['0', '1', '2', '3+']
education = ['Graduate', 'Not Graduate']
self_employed = ['Yes', 'No']
property_area = ['Urban', 'Rural', 'Semiurban']
loan_status = ['Y', 'N']
credit_history_opts = [1.0, 0.0]

# Generate synthetic data
data = {
    'Loan_ID': [f'LP00{1000 + i}' for i in range(num_rows)],
    'Gender': np.random.choice(genders, num_rows, p=[0.8, 0.2]),
    'Married': np.random.choice(married_status, num_rows),
    'Dependents': np.random.choice(dependents, num_rows),
    'Education': np.random.choice(education, num_rows, p=[0.75, 0.25]),
    'Self_Employed': np.random.choice(self_employed, num_rows, p=[0.15, 0.85]),
    'ApplicantIncome': np.random.randint(1500, 10000, num_rows),
    'CoapplicantIncome': np.random.randint(0, 5000, num_rows),
    'LoanAmount': np.random.randint(50, 600, num_rows),
    'Loan_Amount_Term': np.random.choice([360, 180, 480, 300], num_rows, p=[0.85, 0.05, 0.05, 0.05]),
    'Credit_History': np.random.choice(credit_history_opts, num_rows, p=[0.8, 0.2]),
    'Property_Area': np.random.choice(property_area, num_rows),
    'Loan_Status': np.random.choice(loan_status, num_rows, p=[0.7, 0.3])
}

# Create DataFrame
df_synthetic = pd.DataFrame(data)

# Introduce some missing values (NaN) to test your cleaning logic
# (Your code fills numeric with median and object with mode, so this is safe)
for col in ['Gender', 'Married', 'Self_Employed', 'LoanAmount']:
    df_synthetic.loc[df_synthetic.sample(frac=0.05).index, col] = np.nan

# Save to CSV
df_synthetic.to_csv('loan_sanction_dataset.csv', index=False)

print(f"Successfully generated 'loan_sanction_dataset.csv' with {len(df_synthetic)} rows.")
print(df_synthetic.head())