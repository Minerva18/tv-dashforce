import { LightningElement, api, track } from 'lwc';

export default class opportunitiesByStage extends LightningElement {
    @api sobject = '';
    @api socket;

    @track socketInitialized = false;
    @track chartInitialized = false;

    chart;

    //object to keep track of the number of opportunities per stage
    chartData = {};

    chartConfig = {
        type: 'doughnut',
        data: {
            datasets: [
                {
                    data: [],
                    backgroundColor: [
                        '#3296ED',
                        '#9D53F2',
                        '#E287B2',
                        '#26ABA4',
                        '#77B9F2',
                        '#C398F5',
                        '#4ED4CD'
                    ]
                }
            ],
            labels: []
        },
        options: {
            responsive: true,
            elements: {
                arc: {
                    borderWidth: 0
                }
            },
            legend: {
                position: 'right',
                labels: {
                    usePointStyle: true
                }
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

        //update the chartData to increment the corresponding opportunity stage counter
        this.chartData[data.StageName] =
            this.chartData[data.StageName] + 1 || 1;

        //sort chartData in descending order
        let sortable = Object.entries(this.chartData);
        sortable.sort(function(a, b) {
            return b[1] - a[1];
        });

        //update chartData with sorted data
        this.chartData = Object.fromEntries(sortable);

        //add the updated data to the chart object
        this.chart.data.labels = Object.keys(this.chartData);
        this.chart.data.datasets[0].data = Object.values(this.chartData);

        //update the chart to reflect latest data
        this.chart.update();
    }
}
