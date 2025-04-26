// Definición temporal de datasets hasta que tengamos los datos reales
const datasets = window.processData || {};

// Configuración del gráfico
const margin = { top: 20, right: 30, bottom: 40, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Crear el SVG
const svg = d3
	.select('#histogram')
	.append('svg')
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.append('g')
	.attr('transform', `translate(${margin.left},${margin.top})`);

// Función para calcular estadísticas
function calculateStatistics(data) {
	const n = data.length;
	const mean = d3.mean(data);
	const std = d3.deviation(data);

	return {
		mean: mean,
		std: std,
		n: n,
	};
}

// Función para calcular índices de capacidad
function calculateCapabilityIndices(data, lsl, usl, target) {
	const stats = calculateStatistics(data);
	const cp = (usl - lsl) / (6 * stats.std);
	const cpu = (usl - stats.mean) / (3 * stats.std);
	const cpl = (stats.mean - lsl) / (3 * stats.std);
	const cpk = Math.min(cpu, cpl);

	return {
		cp: cp,
		cpk: cpk,
	};
}

// Función para actualizar el histograma
function updateHistogram(data, lsl, usl, target) {
	// Limpiar el contenedor del histograma
	d3.select('#histogram').selectAll('*').remove();

	// Configurar dimensiones con más ancho
	const margin = { top: 10, right: 20, bottom: 30, left: 60 };
	const width = 1200 - margin.left - margin.right;
	const height = 400 - margin.top - margin.bottom;

	// Crear el SVG
	const svg = d3
		.select('#histogram')
		.append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', `translate(${margin.left},${margin.top})`);

	// Escalas
	const x = d3.scaleLinear().domain([0, 150]).range([0, width]);

	const y = d3
		.scaleLinear()
		.domain([0, d3.max(data) * 1.05])
		.range([height, 0]);

	// Dibujar barras
	svg
		.selectAll('rect')
		.data(data)
		.enter()
		.append('rect')
		.attr('x', (d, i) => (width * i) / data.length)
		.attr('y', (d) => y(Math.max(0, d)))
		.attr('width', width / data.length)
		.attr('height', (d) => height - y(Math.max(0, d)))
		.style('fill', '#4a90e2');

	// Agregar ejes básicos
	svg
		.append('g')
		.attr('transform', `translate(0,${height})`)
		.call(d3.axisBottom(x).ticks(30));

	svg.append('g').call(d3.axisLeft(y).ticks(10));
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
	// Inicializar el selector de procesos
	const processSelector = document.getElementById('process-selector');
	if (processSelector) {
		Object.keys(datasets).forEach((dataset) => {
			const option = document.createElement('option');
			option.value = dataset;
			option.textContent = dataset;
			processSelector.appendChild(option);
		});

		// Event listener para el cambio de proceso
		processSelector.addEventListener('change', (e) => {
			const selectedData = datasets[e.target.value];
			if (selectedData && Array.isArray(selectedData.data)) {
				// Asegurarnos de que todos los datos sean números
				const numericData = selectedData.data
					.map(Number)
					.filter((d) => !isNaN(d));
				updateHistogram(numericData, selectedData.lsl, selectedData.usl);
			}
		});

		// Inicializar con el primer dataset si hay datos
		if (Object.keys(datasets).length > 0) {
			const firstData = datasets[Object.keys(datasets)[0]];
			if (firstData && Array.isArray(firstData.data)) {
				const numericData = firstData.data.map(Number).filter((d) => !isNaN(d));
				updateHistogram(numericData, firstData.lsl, firstData.usl);
			}
		}
	}
});
