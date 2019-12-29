import { LightningElement, api, track } from 'lwc';

export default class businessByStage extends LightningElement {
    @api sobject = '';
    @api socket;

    @track socketInitialized = false;
    @track chartInitialized = false;

    chart;

    //object to keep track of the business(sum of opportunities) amount per stage
    chartData = {};

    chartConfig = {
        type: 'bar',
        data: {
            datasets: [
                {
                    data: [],
                    backgroundColor: '#0E6ECE'
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
                            beginAtZero: true,
                            callback: function(label, index, labels) {
                                return label > 1
                                    ? `$${label / 1000000}M`
                                    : label;
                            }
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

    async initializeChart() {
        await require('chart.js');
        window.Chart.defaults.global.defaultFontFamily =
            '"Salesforce Sans", Arial, sans-serif';
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

        //update the chartData with sum of opportunity amount by current stage
        this.chartData[data.StageName] =
            this.chartData[data.StageName] + data.Amount || data.Amount;

        //add the updated data to the chart object
        this.chart.data.labels = Object.keys(this.chartData);
        this.chart.data.datasets[0].data = Object.values(this.chartData);

        //update the chart to reflect latest data
        this.chart.update();
    }
}
