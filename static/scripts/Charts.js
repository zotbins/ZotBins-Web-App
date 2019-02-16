

function get_default_options(){
	Chart.defaults.global.scales = {
					yAxes: [{
						ticks: {
							min: 0, 
						},
						scaleLabel:{
							display: true,
							fontSize: 40,
							labelString: ''
						},
						position: "left",
						id: "yAxes"
					}],
					xAxes:[{
						ticks:{
							maxTicksLimit: 10
						},
						scaleLabel: {
							display: true,
							fontSize: 40,
							labelString: 'Date'
						}
					}]
				}
	Chart.defaults.global["elements"]["point"]["radius"] = 1;
	return Chart.defaults.global;
}


function get_dataset(data, label, color, background){
	return { yAxisID: "yAxes",
			 label: label,
			 borderColor: color,
			 backgroundColor: background,
			 data : data
	};
}