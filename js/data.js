// Estructura de datos para almacenar la información de los tests
const processData = {
	// Ejemplo de estructura que coincide con el Excel
	Test1: {
		testType: 'Type1',
		measurements: [], // Array de mediciones
		usl: 0, // Upper Specification Limit
		lsl: 0, // Lower Specification Limit
		stdDev: 0, // Desviación estándar
		mean: 0, // Media
		cp: 0, // Capacidad de proceso
		cpk: 0, // Capacidad de proceso centrada
	},
	proceso1: {
		name: 'Proceso de Manufactura A',
		data: generateNormalData(100, 10, 2),
		lsl: 5,
		usl: 15,
		target: 10,
	},
	proceso2: {
		name: 'Proceso de Manufactura B',
		data: generateNormalData(100, 50, 5),
		lsl: 35,
		usl: 65,
		target: 50,
	},
	proceso3: {
		name: 'Proceso de Manufactura C',
		data: generateNormalData(100, 100, 10),
		lsl: 70,
		usl: 130,
		target: 100,
	},
};

const testData = {
	'Prueba 1': {
		data: [
			10.2, 10.1, 10.3, 10.0, 9.9, 10.2, 10.1, 10.4, 10.2, 10.3, 10.1, 10.2,
			10.0, 10.3, 10.1, 10.2, 10.4, 10.1, 10.2, 10.3, 9.8, 10.2, 10.1, 10.3,
			10.2, 10.1, 10.0, 10.2, 10.3, 10.1,
		],
		lsl: 9.5,
		usl: 10.5,
		target: 10.0,
	},
	'Prueba 2': {
		data: [
			15.3, 15.4, 15.2, 15.1, 15.5, 15.3, 15.2, 15.4, 15.3, 15.2, 15.4, 15.3,
			15.5, 15.2, 15.3, 15.4, 15.2, 15.3, 15.1, 15.4, 15.3, 15.2, 15.4, 15.5,
			15.3, 15.2, 15.4, 15.3, 15.2, 15.4,
		],
		lsl: 14.8,
		usl: 15.8,
		target: 15.3,
	},
	'Prueba 3': {
		data: [
			20.1, 20.3, 20.2, 20.4, 20.1, 20.2, 20.3, 20.1, 20.2, 20.4, 20.2, 20.3,
			20.1, 20.2, 20.4, 20.3, 20.2, 20.1, 20.3, 20.2, 20.4, 20.2, 20.1, 20.3,
			20.2, 20.4, 20.1, 20.2, 20.3, 20.2,
		],
		lsl: 19.5,
		usl: 20.5,
		target: 20.0,
	},
};

const datasets = {
	'Proceso A': {
		data: [
			10.2, 10.1, 10.3, 10.0, 10.4, 10.2, 10.1, 10.3, 10.2, 10.1, 10.0, 10.2,
			10.3, 10.1, 10.2, 10.4, 10.3, 10.2, 10.1, 10.2, 10.3, 10.1, 10.2, 10.0,
			10.4, 10.2, 10.3, 10.1, 10.2, 10.3,
		],
		lsl: 9.8,
		usl: 10.6,
		target: 10.2,
	},
	'Proceso B': {
		data: [
			15.5, 15.3, 15.8, 15.4, 15.6, 15.5, 15.7, 15.4, 15.5, 15.6, 15.4, 15.5,
			15.3, 15.6, 15.5, 15.8, 15.6, 15.5, 15.4, 15.5, 15.7, 15.5, 15.6, 15.4,
			15.5, 15.3, 15.6, 15.5, 15.7, 15.5,
		],
		lsl: 15.0,
		usl: 16.0,
		target: 15.5,
	},
	'Proceso C': {
		data: [
			20.1, 20.4, 20.2, 20.3, 20.1, 20.2, 20.3, 20.1, 20.4, 20.2, 20.3, 20.1,
			20.2, 20.4, 20.3, 20.2, 20.1, 20.3, 20.2, 20.1, 20.4, 20.2, 20.3, 20.1,
			20.2, 20.3, 20.4, 20.2, 20.1, 20.3,
		],
		lsl: 19.8,
		usl: 20.6,
		target: 20.2,
	},
};

function calculateHistogram(data, bins = 20) {
	const min = Math.min(...data);
	const max = Math.max(...data);
	const binWidth = (max - min) / bins;

	// Crear los bins
	const histogramData = Array(bins).fill(0);
	const binRanges = Array(bins)
		.fill(0)
		.map((_, i) => min + i * binWidth);

	// Contar valores en cada bin
	data.forEach((value) => {
		const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
		histogramData[binIndex]++;
	});

	// Suavizar la distribución usando un promedio móvil
	const smoothedData = histogramData.map((value, index) => {
		if (index === 0 || index === histogramData.length - 1) return value;
		return (histogramData[index - 1] + value + histogramData[index + 1]) / 3;
	});

	return {
		frequencies: smoothedData,
		binRanges: binRanges,
		binWidth: binWidth,
		min: min,
		max: max,
	};
}

function calculateStatistics(measurements, lsl, usl) {
	// Calcular media
	const mean =
		measurements.reduce((acc, val) => acc + val, 0) / measurements.length;

	// Calcular desviación estándar
	const variance =
		measurements.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
		(measurements.length - 1);
	const stdDev = Math.sqrt(variance);

	// Calcular Cp
	const cp = (usl - lsl) / (6 * stdDev);

	// Calcular Cpk
	const cpu = (usl - mean) / (3 * stdDev);
	const cpl = (mean - lsl) / (3 * stdDev);
	const cpk = Math.min(cpu, cpl);

	return { mean, stdDev, cp, cpk };
}

// Variable global para almacenar los datos
window.processData = {};
// Variable para almacenar el primer Test_name
window.firstTestName = '';

// Función para extraer números de una cadena de texto
function extractNumbers(str) {
	if (typeof str !== 'string') {
		str = String(str);
	}
	// Limpiar y convertir el texto a números
	return str
		.split(/[,;\s]+/) // Separar por comas, punto y coma o espacios
		.map((num) => {
			// Eliminar cualquier carácter que no sea número, punto o signo
			const cleanNum = num.replace(/[^\d.-]/g, '');
			const parsed = parseFloat(cleanNum);
			// Solo retornar números válidos y positivos
			return !isNaN(parsed) && parsed >= 0 ? parsed : null;
		})
		.filter((num) => num !== null); // Eliminar valores nulos
}

// Función para crear la gráfica de Gauss general
function updateGaussPlot() {
	// Limpiar el contenedor
	d3.select('#gauss-plot').selectAll('*').remove();

	// Configurar dimensiones
	const margin = { top: 20, right: 30, bottom: 30, left: 40 };
	const width =
		document.getElementById('gauss-plot').clientWidth -
		margin.left -
		margin.right;
	const height =
		document.getElementById('gauss-plot').clientHeight -
		margin.top -
		margin.bottom;

	// Crear el SVG
	const svg = d3
		.select('#gauss-plot')
		.append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', `translate(${margin.left},${margin.top})`);

	// Calcular estadísticas generales
	const allTests = Object.values(window.processData);
	const means = allTests.map((test) => test.mean);
	const stds = allTests.map((test) => test.std);

	// Calcular el rango para el eje X
	const minMean = d3.min(means);
	const maxMean = d3.max(means);
	const range = maxMean - minMean;
	const xDomain = [minMean - range * 0.1, maxMean + range * 0.1];

	// Crear escalas
	const x = d3.scaleLinear().domain(xDomain).range([0, width]);

	// Crear la curva de Gauss para cada test
	const gaussianData = allTests.map((test) => {
		const points = [];
		const step = (xDomain[1] - xDomain[0]) / 100;
		for (let x = xDomain[0]; x <= xDomain[1]; x += step) {
			const y =
				(1 / (test.std * Math.sqrt(2 * Math.PI))) *
				Math.exp(-Math.pow(x - test.mean, 2) / (2 * Math.pow(test.std, 2)));
			points.push([x, y]);
		}
		return points;
	});

	// Encontrar el máximo Y para la escala
	const maxY = d3.max(gaussianData.flat(), (d) => d[1]);

	// Escala Y
	const y = d3.scaleLinear().domain([0, maxY]).range([height, 0]);

	// Crear la línea
	const line = d3
		.line()
		.x((d) => x(d[0]))
		.y((d) => y(d[1]));

	// Dibujar las curvas
	gaussianData.forEach((points, i) => {
		svg
			.append('path')
			.datum(points)
			.attr('fill', 'none')
			.attr('stroke', '#4a90e2')
			.attr('stroke-width', 1)
			.attr('stroke-opacity', 0.1)
			.attr('d', line);
	});

	// Agregar ejes
	svg
		.append('g')
		.attr('transform', `translate(0,${height})`)
		.call(d3.axisBottom(x));

	svg.append('g').call(d3.axisLeft(y));
}

// Función para actualizar la tabla de datos
function updateDataTable() {
	const tbody = document.querySelector('#data-table tbody');
	tbody.innerHTML = '';

	// Ordenar los tests por nombre
	const sortedTests = Object.entries(window.processData).sort((a, b) =>
		a[1].name.localeCompare(b[1].name),
	);

	sortedTests.forEach(([key, test]) => {
		const row = document.createElement('tr');
		row.innerHTML = `
			<td>${test.name}</td>
			<td>${test.lsl.toFixed(4)}</td>
			<td>${test.usl.toFixed(4)}</td>
			<td>${test.target.toFixed(4)}</td>
			<td>${test.mean.toFixed(4)}</td>
			<td>${test.std.toFixed(4)}</td>
			<td>${test.cp.toFixed(4)}</td>
			<td>${test.cpk.toFixed(4)}</td>
		`;
		tbody.appendChild(row);
	});
}

// Función para cargar los datos del archivo Excel
async function loadData() {
	try {
		const response = await fetch('ICT_Cpk_125404.xlsx');
		if (!response.ok) {
			throw new Error('No se pudo cargar el archivo Excel');
		}
		const arrayBuffer = await response.arrayBuffer();
		const workbook = XLSX.read(arrayBuffer, { type: 'array' });

		// Verificar si existe la hoja Statistitical_Data
		if (!workbook.Sheets['Statistitical_Data']) {
			throw new Error('No se encontró la hoja Statistitical_Data');
		}

		const worksheet = workbook.Sheets['Statistitical_Data'];
		const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

		// Guardar el primer Test_name (celda A2)
		if (data.length > 1 && data[1] && data[1][0]) {
			window.firstTestName = data[1][0];
			// Actualizar el placeholder del input de búsqueda
			document.getElementById('test-search').placeholder = window.firstTestName;
		}

		// Procesar cada fila (cada test)
		data.slice(1).forEach((row, index) => {
			if (row.length < 9) return; // Saltar filas incompletas

			const testName = row[0]; // Columna A: Test_name
			const measurements = extractNumbers(row[2]); // Columna C: MEASUREMENT

			if (measurements.length === 0) return; // Saltar si no hay mediciones válidas

			window.processData[`Test ${index + 1}`] = {
				testNumber: index + 1,
				name: testName,
				data: measurements,
				lsl: parseFloat(row[3]) || 0, // Columna D: LSL
				usl: parseFloat(row[4]) || 0, // Columna E: USL
				target: parseFloat(row[5]) || 0, // Columna F: Target
				mean: parseFloat(row[6]) || 0, // Columna G: Mean
				std: parseFloat(row[7]) || 0, // Columna H: Std
				cp: parseFloat(row[8]) || 0, // Columna I: Cp
				cpk: parseFloat(row[9]) || 0, // Columna J: Cpk
			};
		});

		// Verificar si se cargaron datos
		if (Object.keys(window.processData).length === 0) {
			throw new Error('No se encontraron datos válidos en el archivo');
		}

		console.log(
			'Datos cargados exitosamente:',
			Object.keys(window.processData).length,
			'tests',
		);

		// Después de cargar los datos
		updateGaussPlot();
		updateDataTable();

		// Inicializar el selector y mostrar la interfaz
		initializeSelector();
		document.getElementById('data-container').classList.remove('hidden');
		document.getElementById('loading-message').classList.add('hidden');
	} catch (error) {
		console.error('Error al cargar los datos:', error);
		document.getElementById(
			'loading-message',
		).textContent = `Error: ${error.message}`;
		document.getElementById('loading-message').style.color = 'red';
		document.getElementById('loading-message').classList.remove('hidden');
	}
}

// Función para inicializar el selector
function initializeSelector() {
	const selector = document.getElementById('process-selector');
	selector.innerHTML = '';

	// Agregar opción por defecto
	const defaultOption = document.createElement('option');
	defaultOption.value = '';
	defaultOption.textContent = 'Seleccione un test...';
	selector.appendChild(defaultOption);

	// Ordenar y agregar las opciones
	Object.entries(window.processData)
		.sort((a, b) => a[1].testNumber - b[1].testNumber)
		.forEach(([key, data]) => {
			const option = document.createElement('option');
			option.value = key;
			option.textContent = `Test #${data.testNumber} (${data.name})`;
			selector.appendChild(option);
		});

	// Evento de cambio en el selector
	selector.addEventListener('change', (event) => {
		if (event.target.value) {
			const selectedProcess = window.processData[event.target.value];
			updateHistogram(
				selectedProcess.data,
				selectedProcess.lsl,
				selectedProcess.usl,
				selectedProcess.target,
			);

			// Actualizar valores estadísticos con los títulos correctos
			document.getElementById('mean-value').textContent =
				selectedProcess.mean.toFixed(4);
			document.getElementById('std-value').textContent =
				selectedProcess.cp.toFixed(4); // Cambiado de std a cp
			document.getElementById('cp-value').textContent =
				selectedProcess.cpk.toFixed(4); // Cambiado de cp a cpk
			document.getElementById('cpk-value').textContent =
				selectedProcess.std.toFixed(4); // Cambiado de cpk a std
		}
	});

	// Seleccionar el primer test por defecto
	if (Object.keys(window.processData).length > 0) {
		const firstKey = Object.keys(window.processData)[0];
		selector.value = firstKey;
		const event = new Event('change');
		selector.dispatchEvent(event);
	}
}

// Cargar los datos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', loadData);

// Función para generar datos con distribución normal
function generateNormalData(n, mean, std) {
	const data = [];
	for (let i = 0; i < n; i++) {
		// Usando el método Box-Muller para generar números aleatorios con distribución normal
		const u1 = Math.random();
		const u2 = Math.random();
		const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
		data.push(mean + std * z);
	}
	return data;
}

// Generar 639 tests con diferentes parámetros
window.processData = {};

for (let i = 1; i <= 639; i++) {
	// Generar parámetros aleatorios para cada test
	const mean = Math.random() * 100 + 50; // Media entre 50 y 150
	const std = Math.random() * 5 + 1; // Desviación estándar entre 1 y 6
	const target = mean; // El target será igual a la media
	const lsl = mean - 3 * std; // LSL a 3 desviaciones estándar por debajo
	const usl = mean + 3 * std; // USL a 3 desviaciones estándar por arriba

	// Crear nombre de test aleatorio tipo fb0401, fb0702, etc.
	const testName = `fb${String(Math.floor(Math.random() * 99)).padStart(
		2,
		'0',
	)}${String(Math.floor(Math.random() * 99)).padStart(2, '0')}`;

	window.processData[`Test ${i}`] = {
		testNumber: i,
		name: testName,
		data: generateNormalData(100, mean, std),
		lsl: lsl,
		usl: usl,
		target: target,
		mean: mean,
		std: std,
		cp: (usl - lsl) / (6 * std),
		cpk: Math.min((usl - mean) / (3 * std), (mean - lsl) / (3 * std)),
	};
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeSelector);
