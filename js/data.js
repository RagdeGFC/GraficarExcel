// Variable global para almacenar los datos
window.processData = {};
// Variable para almacenar el primer Test_name
window.firstTestName = '';

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
	const selector = document.getElementById('process-selector');
	const selectedTest = window.processData[selector.value];

	if (!selectedTest) return;

	// Limpiar el contenedor
	d3.select('#gauss-plot').selectAll('*').remove();

	// Configurar dimensiones
	const margin = { top: 40, right: 30, bottom: 40, left: 50 };
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

	// Usar los valores existentes del test
	const mean = selectedTest.mean;
	const std = selectedTest.std;
	const lsl = selectedTest.lsl;
	const usl = selectedTest.usl;

	// Calcular el rango para el eje X usando el valor absoluto más alto
	const maxAbsValue = Math.max(Math.abs(lsl), Math.abs(usl));
	const xMin = -maxAbsValue;
	const xMax = maxAbsValue;

	// Crear escala X centrada en 0
	const x = d3.scaleLinear().domain([xMin, xMax]).range([0, width]);

	// Centrar los datos respecto a la media
	const centeredData = selectedTest.data.map((d) => d - mean);

	// Crear el histograma con bins específicos
	const binWidth = (xMax - xMin) / 20; // Dividir en 20 bins
	const histogram = d3
		.histogram()
		.domain(x.domain())
		.thresholds(d3.range(xMin, xMax + binWidth, binWidth));

	const bins = histogram(centeredData);

	// Calcular la frecuencia máxima para el eje Y
	const maxFrequency = d3.max(bins, (d) => d.length);
	const yMax = Math.ceil(maxFrequency / 10) * 10; // Redondear a la decena superior

	// Escala Y para frecuencias
	const y = d3.scaleLinear().domain([0, yMax]).range([height, 0]);

	// Dibujar barras del histograma
	svg
		.selectAll('rect')
		.data(bins)
		.enter()
		.append('rect')
		.attr('x', (d) => x(d.x0))
		.attr('y', (d) => y(d.length))
		.attr('width', (d) => Math.max(0, x(d.x1) - x(d.x0) - 1))
		.attr('height', (d) => height - y(d.length))
		.style('fill', '#7fbfb0')
		.style('opacity', 1);

	// Crear puntos para la curva de Gauss
	const points = [];
	const step = (xMax - xMin) / 100;
	for (let xVal = xMin; xVal <= xMax; xVal += step) {
		// Calcular la altura de la curva normal
		const yVal =
			(1 / (std * Math.sqrt(2 * Math.PI))) *
			Math.exp(-Math.pow(xVal, 2) / (2 * Math.pow(std, 2)));
		points.push([xVal, yVal]);
	}

	// Escalar la curva para que coincida con la altura del histograma
	const yMaxCurve = d3.max(points, (d) => d[1]);
	const scaleFactor = yMax / yMaxCurve;
	points.forEach((point) => (point[1] *= scaleFactor));

	// Dibujar la curva de Gauss
	const line = d3
		.line()
		.x((d) => x(d[0]))
		.y((d) => y(d[1]))
		.curve(d3.curveBasis);

	svg
		.append('path')
		.datum(points)
		.attr('fill', 'none')
		.attr('stroke', 'black')
		.attr('stroke-width', 1.5)
		.attr('stroke-dasharray', '3,3')
		.attr('d', line);

	// Agregar líneas LSL y USL
	const addLimit = (value, label, color) => {
		const centeredValue = value - mean;
		svg
			.append('line')
			.attr('x1', x(centeredValue))
			.attr('x2', x(centeredValue))
			.attr('y1', 0)
			.attr('y2', height)
			.attr('stroke', color)
			.attr('stroke-width', 1.5)
			.attr('stroke-dasharray', '3,3');

		svg
			.append('text')
			.attr('x', x(centeredValue))
			.attr('y', -5)
			.attr('text-anchor', 'middle')
			.attr('fill', color)
			.text(`${label} (${value.toFixed(2)})`);
	};

	// Agregar LSL, USL
	addLimit(lsl, 'LSL', 'red');
	addLimit(usl, 'USL', 'red');

	// Agregar ejes
	// Eje X
	svg
		.append('g')
		.attr('transform', `translate(0,${height})`)
		.call(d3.axisBottom(x).ticks(10).tickFormat(d3.format('.1f'))); // Un decimal

	// Eje Y (frecuencias)
	svg.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('d'))); // Números enteros

	// Línea base
	svg
		.append('line')
		.attr('x1', x(xMin))
		.attr('x2', x(xMax))
		.attr('y1', height)
		.attr('y2', height)
		.attr('stroke', 'black')
		.attr('stroke-width', 1);

	// Agregar título
	svg
		.append('text')
		.attr('x', width / 2)
		.attr('y', -margin.top / 2)
		.attr('text-anchor', 'middle')
		.style('font-size', '14px')
		.text(`Distribución Normal para ${selectedTest.name}`);
}

// Función para actualizar la tabla de datos
function updateDataTable() {
	const tbody = document.querySelector('#data-table tbody');
	tbody.innerHTML = '';

	// Ordenar los tests por número de test (no alfabéticamente)
	const sortedTests = Object.entries(window.processData).sort(
		(a, b) => a[1].testNumber - b[1].testNumber,
	);

	sortedTests.forEach(([key, test], index) => {
		const row = document.createElement('tr');
		row.innerHTML = `
			<td>${index + 1}</td>
			<td>${test.name}</td>
			<td>${test.lsl !== null ? test.lsl.toFixed(4) : '-'}</td>
			<td>${test.usl !== null ? test.usl.toFixed(4) : '-'}</td>
			<td>${test.mean !== null ? test.mean.toFixed(4) : '-'}</td>
			<td>${test.std !== null ? test.std.toFixed(4) : '-'}</td>
			<td>${test.cp !== null ? test.cp.toFixed(4) : '-'}</td>
			<td>${test.cpk !== null ? test.cpk.toFixed(4) : '-'}</td>
		`;

		// Agregar evento de clic a la fila
		row.addEventListener('click', () => {
			// Actualizar el selector
			const selector = document.getElementById('process-selector');
			selector.value = key;

			// Disparar el evento change para actualizar las gráficas
			const event = new Event('change');
			selector.dispatchEvent(event);

			// Resaltar la fila seleccionada
			tbody
				.querySelectorAll('tr')
				.forEach((tr) => tr.classList.remove('selected'));
			row.classList.add('selected');
		});

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
				usl: parseFloat(row[3]), // USL de columna D
				lsl: parseFloat(row[4]), // LSL de columna E
				std: parseFloat(row[5]), // STDEV de columna F
				mean: parseFloat(row[6]), // MEAN de columna G
				cp: parseFloat(row[7]), // Cp de columna H
				cpk: parseFloat(row[8]), // Cpk de columna I
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
			updateGaussPlot();

			// Actualizar valores estadísticos con los títulos correctos
			document.getElementById('mean-value').textContent =
				selectedProcess.mean.toFixed(4);
			document.getElementById('std-value').textContent =
				selectedProcess.std.toFixed(4);
			document.getElementById('cp-value').textContent =
				selectedProcess.cp.toFixed(4);
			document.getElementById('cpk-value').textContent =
				selectedProcess.cpk.toFixed(4);
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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeSelector);

// Agregar manejador para el input de archivo
document.addEventListener('DOMContentLoaded', () => {
	const fileInput = document.querySelector('input[type="file"]');
	if (fileInput) {
		fileInput.addEventListener('change', loadData);
	}
});
