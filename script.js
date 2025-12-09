// --- UTILIDAD GENERAL Y NAVEGACIÓN ---

/**
 * Función de utilidad para parsear y evaluar funciones con Math.js
 * (MEJORADO PARA MAYOR AMIGABILIDAD)
 */
function parseFunction(funcString, variables = ['x', 't', 'y']) {
    let cleanedFuncString = funcString.trim();

    // 1. Manejo de Multiplicación Implícita (el cambio más importante para el usuario final)
    // Reglas: Insertar '*' entre:
    // a) Número y variable/paréntesis: 5x -> 5*x, 5( -> 5*(
    // b) Variable y variable/paréntesis: xy -> x*y, x( -> x*(
    
    // a) Número seguido de variable o paréntesis
    // Busca N(V|() donde N es dígito, V es cualquier letra de variable (x, t, y) o (
    cleanedFuncString = cleanedFuncString.replace(/(\d+(\.\d*)?)([a-z(])/gi, (match, p1, p2, p3) => {
        // Asegurarse de que no sea parte de una notación científica (ej: 1e-5)
        if (p1.toLowerCase().endsWith('e')) return match; 
        return `${p1}*${p3}`;
    });

    // b) Variable seguida de variable o paréntesis
    // Busca V(V|() donde V es cualquier letra de variable (x, t, y)
    const varPattern = new RegExp(`([${variables.join('')}])([a-z(])`, 'gi');
    cleanedFuncString = cleanedFuncString.replace(varPattern, (match, p1, p2) => {
        return `${p1}*${p2}`;
    });
    
    // 2. Traducción de funciones comunes al español
    cleanedFuncString = cleanedFuncString.replace(/sen\(/gi, 'sin('); // seno
    cleanedFuncString = cleanedFuncString.replace(/log\(/gi, 'log('); // logaritmo natural
    cleanedFuncString = cleanedFuncString.replace(/raiz\(/gi, 'sqrt('); // raíz
    cleanedFuncString = cleanedFuncString.replace(/exp\(/gi, 'exp('); // exponencial

    // 3. Potencia Amigable: Convertir '^' a '**' (esto ya lo teníamos, pero es clave)
    cleanedFuncString = cleanedFuncString.replace(/\^/g, '**');

    // 4. Paréntesis adicionales (Si el usuario escribió algo como 'x+1)(y-1)')
    cleanedFuncString = cleanedFuncString.replace(/\)\(/g, ')*(');


    console.log("Función parseada para Math.js:", cleanedFuncString);

    try {
        const compiled = math.compile(cleanedFuncString);
        
        return function(...args) {
            const scope = {};
            variables.forEach((v, i) => {
                // Math.js necesita 'x', 't', 'y', etc. en el scope
                scope[v] = args[i]; 
            });
            // Ejecutar la expresión compilada con el scope de variables correcto
            return compiled.evaluate(scope);
        };
    } catch (e) {
        alert("Error al parsear la función. Revise la sintaxis matemática. (Verifique multiplicaciones, paréntesis y nombres de funciones).");
        console.error("Error de compilación de math.js con la cadena:", cleanedFuncString, e);
        return null;
    }
}

/**
 * Controla la visualización de las pestañas (se mantiene igual)
 */
function openTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => button.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-button[onclick="openTab('${tabId}')"]`).classList.add('active');
}

// Asegurar que la primera pestaña se inicialice correctamente.
document.addEventListener('DOMContentLoaded', () => {
    openTab('secante');
});


// --- 1. MÉTODO DE LA SECANTE (SECANT METHOD) --- (Se mantiene igual, solo usa la nueva parseFunction)
let secChartInstance = null;
function calcularSecante() {
    const fString = document.getElementById('sec-f-x').value;
    let xPrev = parseFloat(document.getElementById('sec-x0').value); // x_i-1
    let xCurr = parseFloat(document.getElementById('sec-x1').value);  // x_i
    const tol = parseFloat(document.getElementById('sec-error').value);

    // Usa la función parseFunction mejorada
    const f = parseFunction(fString, ['x']);
    if (!f) return;

    const tbody = document.getElementById('sec-iterations-body');
    tbody.innerHTML = '';
    
    const maxIter = 50;
    let error = Infinity;
    let k = 0;

    const labels = [];
    const xValues = [];

    // Verificación de valores iniciales
    try {
        const fxPrevInit = f(xPrev);
        const fxCurrInit = f(xCurr);
        if (fxCurrInit === fxPrevInit) {
            alert("¡Error! f(x1) = f(x0). Elija nuevos puntos iniciales donde f(x) sea diferente.");
            return;
        }
    } catch (e) {
         alert("Error al evaluar la función con los valores iniciales. Revise la función.");
         return;
    }


    while (error > tol && k < maxIter) {
        let fxPrev, fxCurr;
        try {
             fxPrev = f(xPrev);
             fxCurr = f(xCurr);
        } catch (e) {
             alert(`Error al evaluar la función en la iteración ${k+1}.`);
             return;
        }


        if (fxCurr - fxPrev === 0) {
            alert(`División por cero en la iteración ${k+1}. La pendiente es vertical. Convergencia fallida.`);
            return;
        }

        // Fórmula de la Secante: x_{i+1}
        const xNext = xCurr - (fxCurr * (xCurr - xPrev)) / (fxCurr - fxPrev);
        
        error = Math.abs(xNext - xCurr);
        
        // Agregar fila a la tabla
        const row = tbody.insertRow();
        row.insertCell().textContent = k + 1;
        row.insertCell().textContent = xPrev.toFixed(6);
        row.insertCell().textContent = xCurr.toFixed(6);
        row.insertCell().textContent = xNext.toFixed(6);
        row.insertCell().textContent = error.toExponential(2);
        
        // Datos para el gráfico
        labels.push(k + 1);
        xValues.push(xNext);

        // Actualizar valores para la próxima iteración
        xPrev = xCurr;
        xCurr = xNext;
        k++;
    }

    if (error <= tol) {
        alert(`Converge. Raíz ≈ ${xCurr.toFixed(6)} después de ${k} iteraciones.`);
    } else {
        alert("No converge después de 50 iteraciones. Revise la función o los puntos iniciales.");
    }
    
    updateSecChart(labels, xValues);
}

function updateSecChart(labels, data) {
    const ctx = document.getElementById('secChart').getContext('2d');
    if (secChartInstance) secChartInstance.destroy();

    secChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Valor de x_{i+1} (Raíz)',
                data: data,
                borderColor: '#FFD700', // Amarillo
                backgroundColor: 'rgba(255, 215, 0, 0.2)',
                borderWidth: 3,
                pointRadius: 5,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Iteración (k)', color: 'white' }, ticks: { color: 'white' }, grid: { color: '#3C5068' } },
                y: { title: { display: true, text: 'Valor de la Raíz', color: 'white' }, ticks: { color: 'white' }, grid: { color: '#3C5068' } }
            },
            plugins: { legend: { labels: { color: 'white' } } }
        }
    });
}


// --- 2. MÉTODO DE NEWTON-RAPHSON (TIR) --- (Se mantiene igual, no usa parseFunction)
let nrChartInstance = null;

function calculateVAN(r, I0, flows) {
    let van = I0;
    flows.forEach((Ct, t) => {
        van += Ct / Math.pow(1 + r, t + 1);
    });
    return van;
}

function calculateVANPrime(r, flows) {
    let vanPrime = 0;
    flows.forEach((Ct, t) => {
        const period = t + 1;
        vanPrime += (-period * Ct) / Math.pow(1 + r, period + 1);
    });
    return vanPrime;
}

function calcularNewtonRaphsonTIR() {
    const I0 = parseFloat(document.getElementById('nr-investment').value);
    const flows = document.getElementById('nr-flows').value.split(',').map(s => parseFloat(s.trim()));
    let rk = parseFloat(document.getElementById('nr-r0').value);
    const tol = parseFloat(document.getElementById('nr-error').value);

    if (I0 >= 0 || flows.some(f => isNaN(f))) {
        alert("Verifique la Inversión Inicial (debe ser negativa) y los Flujos de Caja.");
        return;
    }

    const tbody = document.getElementById('nr-iterations-body');
    tbody.innerHTML = '';
    
    const maxIter = 50;
    let error = Infinity;
    let k = 0;

    const labels = [];
    const rValues = [];

    while (error > tol && k < maxIter) {
        const van = calculateVAN(rk, I0, flows);
        const vanPrime = calculateVANPrime(rk, flows);

        if (vanPrime === 0) {
            alert("Error: Derivada (VAN') es cero. No se puede continuar.");
            return;
        }

        const rNext = rk - (van / vanPrime);
        error = Math.abs(rNext - rk);
        
        const row = tbody.insertRow();
        row.insertCell().textContent = k + 1;
        row.insertCell().textContent = (rk * 100).toFixed(4) + '%';
        row.insertCell().textContent = van.toFixed(4);
        row.insertCell().textContent = vanPrime.toFixed(4);
        row.insertCell().textContent = error.toExponential(2);
        
        labels.push(k + 1);
        rValues.push(rNext * 100);

        rk = rNext;
        k++;
    }

    if (error <= tol) {
        alert(`Converge. La TIR es ≈ ${(rk * 100).toFixed(4)}% después de ${k} iteraciones.`);
    } else {
        alert("No converge después de 50 iteraciones.");
    }
    
    updateNrChart(labels, rValues, rk);
}

function updateNrChart(labels, data, finalR) {
    const ctx = document.getElementById('nrChart').getContext('2d');
    if (nrChartInstance) nrChartInstance.destroy();

    const I0 = parseFloat(document.getElementById('nr-investment').value);
    const flows = document.getElementById('nr-flows').value.split(',').map(s => parseFloat(s.trim()));

    const rPoints = [];
    const vanPoints = [];
    const rMin = Math.max(0, finalR * 0.5); 
    const rMax = finalR * 1.5 > 0 ? finalR * 1.5 : 0.5;

    for (let r = rMin; r <= rMax; r += (rMax - rMin) / 50) {
        rPoints.push(r * 100);
        vanPoints.push(calculateVAN(r, I0, flows));
    }


    nrChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rPoints.map(r => r.toFixed(2) + '%'),
            datasets: [
                {
                    label: 'VAN(r)',
                    data: vanPoints,
                    borderColor: '#00FF8C', // Verde Neón
                    backgroundColor: 'rgba(0, 255, 140, 0.2)',
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.4
                },
                {
                    label: 'TIR (Punto de Corte)',
                    data: [{ x: finalR * 100, y: 0 }],
                    borderColor: '#FF1744', // Rojo Neón
                    backgroundColor: '#FF1744',
                    pointRadius: 8,
                    type: 'scatter'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Tasa de Interés r (%)', color: 'white' }, ticks: { color: 'white' }, grid: { color: '#3C5068' } },
                y: { title: { display: true, text: 'Valor Actual Neto (VAN)', color: 'white' }, ticks: { color: 'white' }, grid: { color: '#3C5068' } }
            },
            plugins: { legend: { labels: { color: 'white' } } }
        }
    });
}


// --- 3. MÉTODO DE RUNGE-KUTTA 4 (RK4) --- (Se mantiene igual, solo usa la nueva parseFunction)
let rk4ChartInstance = null;
function calcularRungeKutta() {
    const fString = document.getElementById('rk4-f-ty').value;
    let t0 = parseFloat(document.getElementById('rk4-t0').value);
    let y0 = parseFloat(document.getElementById('rk4-y0').value);
    const tf = parseFloat(document.getElementById('rk4-tf').value);
    const h = parseFloat(document.getElementById('rk4-h').value);

    // Parsear función con dos variables: 't' y 'y', usando la función mejorada
    const f = parseFunction(fString, ['t', 'y']);
    if (!f) return;

    if (h <= 0 || t0 >= tf) {
        alert("Revise el Tamaño de Paso (h > 0) y los tiempos (t0 < tf).");
        return;
    }

    const tbody = document.getElementById('rk4-iterations-body');
    tbody.innerHTML = '';
    
    let t = t0;
    let y = y0;
    let k = 0;

    const tValues = [t0];
    const yValues = [y0];

    // Bucle principal de RK4
    while (t < tf) {
        // Asegurar que el último paso no exceda tf (ajustar h si es necesario)
        const h_actual = Math.min(h, tf - t);

        let k1, k2, k3, k4;
        try {
            // Runge-Kutta de Orden 4
            k1 = h_actual * f(t, y);
            k2 = h_actual * f(t + h_actual / 2, y + k1 / 2);
            k3 = h_actual * f(t + h_actual / 2, y + k2 / 2);
            k4 = h_actual * f(t + h_actual, y + k3);
        } catch (e) {
            alert(`Error al evaluar la función en la iteración ${k}. Revise la sintaxis.`);
            return;
        }

        const yNext = y + (1 / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
        
        // Agregar fila a la tabla
        const row = tbody.insertRow();
        row.insertCell().textContent = k;
        row.insertCell().textContent = t.toFixed(4);
        row.insertCell().textContent = y.toFixed(6);
        row.insertCell().textContent = k1.toFixed(6);
        row.insertCell().textContent = k2.toFixed(6);
        
        // Preparar para la próxima iteración
        t += h_actual;
        y = yNext;
        
        // Guardar valores 
        tValues.push(t);
        yValues.push(y);

        k++;
        
        if (k > 2000) { // Límite de seguridad alto
            alert("Límite de 2000 iteraciones alcanzado. Revise el tamaño de paso (h).");
            break;
        }
    }
    
    // El último punto ya está incluido
    alert(`Simulación completada. Posición final y(${t.toFixed(4)}) ≈ ${y.toFixed(6)}.`);
    
    updateRk4Chart(tValues, yValues);
}

function updateRk4Chart(tValues, yValues) {
    const ctx = document.getElementById('rk4Chart').getContext('2d');
    if (rk4ChartInstance) rk4ChartInstance.destroy();

    rk4ChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: tValues.map(t => t.toFixed(2)),
            datasets: [{
                label: 'Trayectoria y(t)',
                data: yValues,
                borderColor: '#4FC3F7', // Azul Neón
                backgroundColor: 'rgba(79, 195, 247, 0.2)',
                borderWidth: 3,
                pointRadius: 4,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Tiempo (t)', color: 'white' }, ticks: { color: 'white' }, grid: { color: '#3C5068' } },
                y: { title: { display: true, text: 'Posición (y)', color: 'white' }, ticks: { color: 'white' }, grid: { color: '#3C5068' } }
            },
            plugins: { legend: { labels: { color: 'white' } } }
        }
    });
}