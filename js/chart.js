let myChart = null;

function createHistogramChart(data) {
	const ctx = document.getElementById('myChart').getContext('2d');
	const histogramData = calculateHistogram(data.values, 12); // 12 bins como en la imagen

	// Si ya existe una gráfica, destruirla
	if (myChart) {
		myChart.destroy();
	}

	// Crear nueva gráfica
	myChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: histogramData.binRanges.map(
				(range, i) =>
					`${range.toFixed(1)}-${(range + histogramData.binWidth).toFixed(1)}`,
			),
			datasets: [
				{
					label: 'Frecuencia',
					data: histogramData.frequencies,
					backgroundColor: 'rgba(54, 162, 235, 0.5)',
					borderColor: 'rgba(54, 162, 235, 1)',
					borderWidth: 1,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				y: {
					beginAtZero: true,
					title: {
						display: true,
						text: 'Frecuencia',
					},
				},
				x: {
					title: {
						display: true,
						text: 'Valores',
					},
				},
			},
			plugins: {
				title: {
					display: true,
					text: 'Histograma de Distribución',
				},
			},
		},
	});

	// Actualizar información estadística
	document.getElementById('mean').textContent = data.mean.toFixed(2);
	document.getElementById('stdDev').textContent = data.stdDev.toFixed(5);
	document.getElementById('cp').textContent = data.cp.toFixed(2);
}

// Event Listener para el selector
document.getElementById('dataSelector').addEventListener('change', (e) => {
	if (e.target.value) {
		const selectedData = processData[e.target.value];
		createHistogramChart(selectedData);
	}
});

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', loadDataSelector);
