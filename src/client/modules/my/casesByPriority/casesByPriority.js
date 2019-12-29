import { LightningElement, api, track } from 'lwc';

export default class casesByPriority extends LightningElement {
    @api sobject = '';
    @api socket;

    @track socketInitialized = false;
    @track chartInitialized = false;

    chart;

    //object to keep track of the number of opportunities per stage
    chartData = {};

    chartConfig = {
        type: 'bar',
        data: {
            datasets: [
                {
                    data: [],
                    backgroundColor: '#3296ED'
                }
            ],
            labels: []
        },
        options: {
            scales: {
                xAxes: [
                    {
                        gridLines: {
                            display: false
                        }
                    }
                ],
                yAxes: [
                    {
                        ticks: {
                            beginAtZero: true
                        }
                    }
                ]
            },
            responsive: true,
            legend: {
                display: false
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    };

    async renderedCallback() {
        if (!this.socketInitialized && this.socket) {
            this.initializeSocket();
        }
        if (!this.chartInitialized && this.socketInitialized) {
            await this.initializeChart();
        }
    }

    initializeSocket() {
        //bind the onSocketEvent method to the 'cdc' socket event to update the chart with new incoming data
        this.socket.on('cdc', this.onSocketEvent.bind(this));
        this.socketInitialized = true;
    }

    //initialize chart with chart.js
    async initializeChart() {
        await require('chart.js');
        const ctx = this.template
            .querySelector('canvas.chart')
            .getContext('2d');
        this.chart = new window.Chart(ctx, this.chartConfig);
        this.chartInitialized = true;
    }

    onSocketEvent(data) {
        const { changeType, entityName } = data.ChangeEventHeader;

        // check to make sure the change event is for the configured sobject and the record event is CREATE
        if (
            this.sobject.toLowerCase() !== entityName.toLowerCase() ||
            changeType !== 'CREATE'
        ) {
            return;
        }

        //update the chartData to increment the corresponding case priority counter
        this.chartData[data.Priority] = this.chartData[data.Priority] + 1 || 1;

        //add the updated data to the chart object
        this.chart.data.labels = Object.keys(this.chartData);
        this.chart.data.datasets[0].data = Object.values(this.chartData);

        //update the chart to reflect latest data
        this.chart.update();
    }
}
