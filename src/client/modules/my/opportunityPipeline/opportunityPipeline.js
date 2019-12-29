import { LightningElement, api, track } from 'lwc';

const monthList = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
];
const today = new Date();

export default class opportunityPipeline extends LightningElement {
    @api sobject = '';
    @api socket;

    @track socketInitialized = false;
    @track chartInitialized = false;

    chart;

    //object to keep track of the opportunity amount per month
    chartData = {};

    chartConfig = {
        type: 'line',
        data: {
            datasets: [
                {
                    data: [],
                    borderColor: '#9D53F2',
                    backgroundColor: 'rgba(157,83,242,0.1)',
                    lineTension: 0
                }
            ],
            labels: []
        },
        options: {
            responsive: true,
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
            elements: {
                point: {
                    backgroundColor: '#9D53F2',
                    borderWidth: 3
                }
            },
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
        const ctx = this.template
            .querySelector('canvas.chart')
            .getContext('2d');
        this.chart = new window.Chart(ctx, this.chartConfig);

        //initialize months of current year on x-axis
        monthList.forEach(item => {
            this.chartData[
                `${item} ${today
                    .getFullYear()
                    .toString()
                    .slice(-2)}`
            ] = 0;
        });
        this.chart.data.labels = Object.keys(this.chartData);
        this.chart.data.datasets[0].data = Object.values(this.chartData);
        this.chart.update();

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

        //get formatted string of the current opportunity close date
        const monthYearStr = this.getMonthAndYear(data.CloseDate);

        //update the chartData to increment the sum of opportunity amount pre month year
        if (this.chartData.hasOwnProperty(monthYearStr)) {
            this.chartData[monthYearStr] =
                this.chartData[monthYearStr] + data.Amount || data.Amount;
        }

        //add the updated data to the chart object
        this.chart.data.labels = Object.keys(this.chartData);
        this.chart.data.datasets[0].data = Object.values(this.chartData);

        //update the chart to reflect latest data
        this.chart.update();
    }

    getMonthAndYear(closeDateStr) {
        const closeDate = new Date(closeDateStr);

        return `${monthList[closeDate.getMonth()]} ${closeDate
            .getFullYear()
            .toString()
            .slice(-2)}`;
    }
}
