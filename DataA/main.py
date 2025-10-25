import pandas as pd
import numpy as np
import tensorflow as tf
import joblib
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware # Para permitir Next.js

# --- Cargar los activos guardados ---
app = FastAPI()
model = tf.keras.models.load_model('consumption_model.keras')
trained_model_columns = joblib.load('model_columns.pkl')
todos_los_productos = joblib.load('all_products.pkl')

# --- Añadir Middleware CORS ---
# Esto permite que tu app de Next.js (desde otro dominio) llame a esta API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permite todos los orígenes (para desarrollo)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Definir la ESTRUCTURA de datos de entrada ---
class VueloInput(BaseModel):
    Origin: str
    Date: str
    Flight_Type: str
    Passenger_Count: int

# --- Re-crear tu función de preprocesamiento ---
def preparar_datos_para_prediccion(raw_data_dict, model_columns):
    df = pd.DataFrame([raw_data_dict])
    df['Date'] = pd.to_datetime(df['Date'])
    df['Year'] = df['Date'].dt.year
    df['Month'] = df['Date'].dt.month
    df['DayOfWeek'] = df['Date'].dt.dayofweek
    df = df.drop('Date', axis=1)
    df = pd.get_dummies(df, columns=['Origin', 'Flight_Type', 'Product_Name'])
    df = df.reindex(columns=model_columns, fill_value=0)
    df = df.astype('float32')
    return df

# --- Crear el Endpoint de Predicción ---
@app.post("/predict_list")
def predict_list(vuelo_input: VueloInput):

    datos_vuelo_base = vuelo_input.dict()
    objeto_de_predicciones = {}

    # Tu "bucle mágico"
    for producto in todos_los_productos:
        datos_completos = datos_vuelo_base.copy()
        datos_completos['Product_Name'] = producto

        datos_listos = preparar_datos_para_prediccion(
            datos_completos, 
            trained_model_columns
        )

        prediccion_cantidad = model.predict(datos_listos, verbose=0)[0][0]

        if prediccion_cantidad > 1.0:
            objeto_de_predicciones[producto] = int(round(prediccion_cantidad))

    # Ordenar y devolver el "objeto"
    predicciones_ordenadas = sorted(
        objeto_de_predicciones.items(), 
        key=lambda item: item[1], 
        reverse=True
    )

    return {"predictions": dict(predicciones_ordenadas)}

# --- (Opcional) Endpoint de bienvenida ---
@app.get("/")
def read_root():
    return {"message": "API de Predicción de Consumo"}