from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

# Cargar modelos
modelo = joblib.load('modelo_cancelacion.pkl')
scaler = joblib.load('scaler_cancelacion.pkl')
modelo_kmeans = joblib.load('kmeans_nova_graf.pkl')
scaler_kmeans = joblib.load('scaler_nova_graf.pkl')

NOMBRES_CLUSTER = {
    0: "VIP",
    1: "Ocasional",
    2: "Inactivo"
}

# --- RUTA PRINCIPAL (Evita el error 404) ---
@app.route('/', methods=['GET'])
def inicio():
    return jsonify({
        'estado': 'API activa y funcionando',
        'endpoints_disponibles': {
            '/health': 'Verificar estado del servidor (GET)',
            '/predecir-cancelacion': 'Predicción de riesgo de cancelación (POST)',
            '/predecir-cluster': 'Predicción de segmento de usuario (POST)'
        }
    })

@app.route('/predecir-cancelacion', methods=['POST'])
def predecir():
    try:
        datos = request.get_json()
        features = np.array([[
            datos['edad'],
            datos['total_pedidos'],
            datos['tasa_cancelacion'],
            datos['metodo_pago'],
            datos['metodo_entrega'],
            datos['es_nuevo'],
            datos['cantidad_productos'],
            datos['dias_entrega'],
        ]])
        features_scaled = scaler.transform(features)
        prediccion = modelo.predict(features_scaled)[0]
        return jsonify({
            'cancelado': int(prediccion),
            'riesgo': 'ALTO' if prediccion == 1 else 'BAJO'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/predecir-cluster', methods=['POST'])
def predecir_cluster():
    try:
        import pandas as pd
        datos = request.get_json()
        
        features = pd.DataFrame([[
            datos['edad'],
            datos['antiguedad_cliente'],
            datos['gasto_total'],
            datos['tasa_cancelacion'],
            datos['categorias_distintas'],
            datos['dias_desde_ultima_compra'],
            datos['productos_promedio_pedido'],
        ]], columns=[
            'edad', 'antiguedad_cliente', 'gasto_total',
            'tasa_cancelacion', 'categorias_distintas',
            'dias_desde_ultima_compra', 'productos_promedio_pedido'
        ])

        features_scaled = scaler_kmeans.transform(features)
        cluster = modelo_kmeans.predict(features_scaled)[0]

        return jsonify({
            'cluster': int(cluster),
            'segmento': NOMBRES_CLUSTER.get(int(cluster), 'Ocasional')
        })
    except Exception as e:
        print('ERROR CLUSTER:', str(e))
        return jsonify({'error': str(e)}), 400

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080, debug=False)
