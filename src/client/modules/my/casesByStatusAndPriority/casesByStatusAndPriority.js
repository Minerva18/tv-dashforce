import { LightningElement, api, track } from 'lwc';

export default class casesByStatusAndPriority extends LightningElement {
    @api sobject = '';
    @api socket;

    @track socketInitialized = false;
    @track chartInitialized = false;

    chart;

    caseProtities = [];

    //object to keep track of the case priority count by each status
    chartData = {};

    casePriorityColors = { High: '#051C61', Medium: '#0E6ECE', Low: '#68CEEE' };

    chartConfig = {
        type: 'horizontalBar',
        data: {
            datasets: [],
            labels: []
        },
        options: {
            scales: {
                xAxes: [
                    {
                        stacked: true
                    }
                ],
                yAxes: [
                    {
                        stacked: true,
                        ticks: {
                            beginAtZero: true
                        }
                    }
                ]
            },
            responsive: true,
            legend: {
                display: true
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

        if (this.caseProtities.indexOf(data.Priority) === -1) {
            this.caseProtities.push(data.Priority);
        }

        if (
            this.chartData[data.Status] &&
            this.chartData[data.Status][data.Priority]
        ) {
            this.chartData[data.Status][data.Priority]++;
        } else {
            this.chartData[data.Status] = {
                ...this.chartData[data.Status],
                [data.Priority]: 1
            };
        }

        //prepare dataset from chartData
        let dataset = {};
        for (let status in this.chartData) {
            if (this.chartData.hasOwnProperty(status)) {
                this.caseProtities.forEach(priority => {
                    if (!this.chartData[status].hasOwnProperty(priority)) {
                        this.chartData[status][priority] = 0;
                    }
                    if (dataset[priority]) {
                        dataset[priority].push(
                            this.chartData[status][priority]
                        );
                    } else {
                        dataset[priority] = [this.chartData[status][priority]];
                    }
                });
            }
        }

        //update chart labels case statuses on y-axis from dataset
        this.chart.data.labels = Object.keys(this.chartData);

        //update chart data case statuses on x-axis from dataset
        Object.keys(dataset).forEach((casePriority, idx) => {
            let currentPriorityIdx = this.chart.data.datasets.findIndex(
                elem => elem.label === casePriority
            );
            if (currentPriorityIdx > -1) {
                this.chart.data.datasets[currentPriorityIdx].data =
                    dataset[casePriority];
            } else {
                this.chart.data.datasets.push({
                    label: casePriority,
                    data: dataset[casePriority],
                    backgroundColor: this.casePriorityColors[casePriority]
                });
            }
        });

        //update the chart to reflect latest data
        this.chart.update();
    }
}
