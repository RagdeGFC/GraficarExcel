// Función para dibujar la curva de Gauss
function drawGaussCurve(data, mean, stdDev, lsl, usl, target) {
	// Limpiar el contenedor
	d3.select('#gauss-plot').selectAll('*').remove();

	// Configurar dimensiones
	const margin = { top: 10, right: 20, bottom: 30, left: 60 };
	const width = 1200 - margin.left - margin.right;
	const height = 400 - margin.top - margin.bottom;

	// Crear el SVG
	const svg = d3
		.select('#gauss-plot')
		.append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', `translate(${margin.left},${margin.top})`);

	// Calcular el rango para el eje X (4 desviaciones estándar a cada lado de la media)
	const range = stdDev * 4;
	const xMin = Math.min(mean - range, lsl - stdDev);
	const xMax = Math.max(mean + range, usl + stdDev);

	// Crear escalas
	const x = d3.scaleLinear().domain([xMin, xMax]).range([0, width]);

	const y = d3.scaleLinear().domain([0, 1]).range([height, 0]);

	// Generar puntos para la curva de Gauss
	const points = [];
	const step = (xMax - xMin) / 200;
	for (let xVal = xMin; xVal <= xMax; xVal += step) {
		const yVal =
			(1 / (stdDev * Math.sqrt(2 * Math.PI))) *
			Math.exp(-Math.pow(xVal - mean, 2) / (2 * Math.pow(stdDev, 2)));
		points.push([xVal, yVal]);
	}

	// Normalizar los valores Y
	const maxY = d3.max(points, (d) => d[1]);
	points.forEach((point) => (point[1] = point[1] / maxY));

	// Dibujar la curva de Gauss
	const line = d3
		.line()
		.x((d) => x(d[0]))
		.y((d) => y(d[1]));

	// Área bajo la curva
	svg
		.append('path')
		.datum(points)
		.attr('fill', '#4a90e24d')
		.attr('stroke', 'none')
		.attr(
			'd',
			d3
				.area()
				.x((d) => x(d[0]))
				.y0(height)
				.y1((d) => y(d[1])),
		);

	// Línea de la curva
	svg
		.append('path')
		.datum(points)
		.attr('fill', 'none')
		.attr('stroke', '#4a90e2')
		.attr('stroke-width', 2)
		.attr('d', line);

	// Agregar líneas de LSL y USL
	svg
		.append('line')
		.attr('x1', x(lsl))
		.attr('x2', x(lsl))
		.attr('y1', 0)
		.attr('y2', height)
		.attr('stroke', 'red')
		.attr('stroke-dasharray', '5,5');

	svg
		.append('line')
		.attr('x1', x(usl))
		.attr('x2', x(usl))
		.attr('y1', 0)
		.attr('y2', height)
		.attr('stroke', 'red')
		.attr('stroke-dasharray', '5,5');

	// Agregar línea del target
	svg
		.append('line')
		.attr('x1', x(target))
		.attr('x2', x(target))
		.attr('y1', 0)
		.attr('y2', height)
		.attr('stroke', 'green')
		.attr('stroke-dasharray', '5,5');

	// Agregar etiquetas para LSL, USL y Target
	svg
		.append('text')
		.attr('x', x(lsl))
		.attr('y', height + 20)
		.attr('text-anchor', 'middle')
		.text('LSL');

	svg
		.append('text')
		.attr('x', x(usl))
		.attr('y', height + 20)
		.attr('text-anchor', 'middle')
		.text('USL');

	svg
		.append('text')
		.attr('x', x(target))
		.attr('y', height + 20)
		.attr('text-anchor', 'middle')
		.text('Target');

	// Agregar ejes
	svg
		.append('g')
		.attr('transform', `translate(0,${height})`)
		.call(d3.axisBottom(x));

	svg.append('g').call(d3.axisLeft(y).ticks(5));
}

// Función para actualizar la gráfica cuando cambia el selector
function updateGaussPlot(selectedTest) {
	const testInfo = window.processData[selectedTest];
	if (!testInfo) return;

	const stats = calculateStatistics(
		testInfo.measurements,
		testInfo.lsl,
		testInfo.usl,
	);
	drawGaussCurve(
		testInfo.measurements,
		stats.mean,
		stats.stdDev,
		testInfo.lsl,
		testInfo.usl,
		testInfo.target,
	);
}

// Conectar con el selector existente
document.getElementById('dataset-selector').addEventListener('change', (e) => {
	updateGaussPlot(e.target.value);
});

// Inicializar con el primer test disponible
window.addEventListener('load', () => {
	if (window.firstTestName) {
		updateGaussPlot(window.firstTestName);
	}
});
