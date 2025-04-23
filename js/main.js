// Configuración inicial del gráfico
const margin = { top: 20, right: 30, bottom: 40, left: 40 };
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Crear el elemento SVG
const svg = d3
	.select('#histogram')
	.append('svg')
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.append('g')
	.attr('transform', `translate(${margin.left},${margin.top})`);

// Función para calcular estadísticas
function calculateStatistics(data) {
	const mean = d3.mean(data);
	const std = d3.deviation(data);

	// Calcular Cp y Cpk
	const currentTest = document.getElementById('dataSelect').value;
	const lsl = testData[currentTest].lsl;
	const usl = testData[currentTest].usl;
	const target = testData[currentTest].target;

	const cp = (usl - lsl) / (6 * std);
	const cpu = (usl - mean) / (3 * std);
	const cpl = (mean - lsl) / (3 * std);
	const cpk = Math.min(cpu, cpl);

	return {
		mean: mean.toFixed(3),
		std: std.toFixed(3),
		cp: cp.toFixed(3),
		cpk: cpk.toFixed(3),
	};
}

// Función para actualizar el histograma
function updateHistogram() {
	// Limpiar el SVG
	svg.selectAll('*').remove();

	// Obtener los datos seleccionados
	const currentTest = document.getElementById('dataSelect').value;
	const data = testData[currentTest].data;

	// Calcular y mostrar estadísticas
	const stats = calculateStatistics(data);
	document.getElementById('mean').textContent = stats.mean;
	document.getElementById('std').textContent = stats.std;
	document.getElementById('cp').textContent = stats.cp;
	document.getElementById('cpk').textContent = stats.cpk;

	// Crear el histograma
	const histogram = d3.histogram().domain(d3.extent(data)).thresholds(10);

	const bins = histogram(data);

	// Escalas
	const x = d3
		.scaleLinear()
		.domain([d3.min(data), d3.max(data)])
		.range([0, width]);

	const y = d3
		.scaleLinear()
		.domain([0, d3.max(bins, (d) => d.length)])
		.range([height, 0]);

	// Dibujar barras
	svg
		.selectAll('rect')
		.data(bins)
		.enter()
		.append('rect')
		.attr('x', (d) => x(d.x0))
		.attr('y', (d) => y(d.length))
		.attr('width', (d) => x(d.x1) - x(d.x0) - 1)
		.attr('height', (d) => height - y(d.length))
		.style('fill', '#69b3a2');

	// Añadir ejes
	svg
		.append('g')
		.attr('transform', `translate(0,${height})`)
		.call(d3.axisBottom(x));

	svg.append('g').call(d3.axisLeft(y));

	// Añadir líneas de especificación
	const lsl = testData[currentTest].lsl;
	const usl = testData[currentTest].usl;
	const target = testData[currentTest].target;

	// LSL
	svg
		.append('line')
		.attr('x1', x(lsl))
		.attr('x2', x(lsl))
		.attr('y1', 0)
		.attr('y2', height)
		.style('stroke', 'red')
		.style('stroke-dasharray', '4');

	// USL
	svg
		.append('line')
		.attr('x1', x(usl))
		.attr('x2', x(usl))
		.attr('y1', 0)
		.attr('y2', height)
		.style('stroke', 'red')
		.style('stroke-dasharray', '4');

	// Target
	svg
		.append('line')
		.attr('x1', x(target))
		.attr('x2', x(target))
		.attr('y1', 0)
		.attr('y2', height)
		.style('stroke', 'green');
}

// Inicializar el selector de datos
const dataSelect = document.getElementById('dataSelect');
for (const test in testData) {
	const option = document.createElement('option');
	option.value = test;
	option.textContent = test;
	dataSelect.appendChild(option);
}

// Evento de cambio en el selector
dataSelect.addEventListener('change', updateHistogram);

// Cargar el histograma inicial
updateHistogram();
