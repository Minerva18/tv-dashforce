import { LightningElement, api, track } from 'lwc';

export default class closedBusiness extends LightningElement {
    @api sobject = '';
    @api socket;

    @track socketInitialized = false;
    @track chartInitialized = false;

    chart;

    totalAmount = 0;

    chartConfig = {
        angle: 0, // The span of the gauge arc
        lineWidth: 0.12, // The line thickness
        radiusScale: 1, // Relative radius
        pointer: {
            length: 0.43, // // Relative to gauge radius
            strokeWidth: 0.035, // The thickness
            color: '#000000' // Fill color
        },
        staticZones: [
            { strokeStyle: '#C23934', min: 0, max: 1650000 },
            { strokeStyle: '#FDB75D', min: 1650000, max: 3300000 },
            { strokeStyle: '#24716B', min: 3300000, max: 5000000 }
        ],
        limitMax: false, // If false, max value increases automatically if value > maxValue
        limitMin: false, // If true, the min value of the gauge will be fixed
        colorStart: '#6FADCF', // Colors
        colorStop: '#8FC0DA', // just experiment with them
        strokeColor: '#E0E0E0', // to see which ones work best for you
        generateGradient: true,
        highDpiSupport: true // High resolution support
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
        const gaugeJS = await require('gaugeJS');

        //HTML canvas for gauge chart
        const ctx = this.template.querySelector('canvas.chart');

        //HTML element for animated number counter
        const gaugeValueHolder = this.template.querySelector(
            'span.gauge-value'
        );

        this.chart = new gaugeJS.Gauge(ctx).setOptions(this.chartConfig);

        //set other chart options
        this.chart.maxValue = 5000000;
        this.chart.setTextField(gaugeValueHolder);
        this.chart.setMinValue(0);
        this.chart.animationSpeed = 5;
        this.chart.set(0);

        this.chartInitialized = true;
    }

    onSocketEvent(data) {
        const { changeType, entityName } = data.ChangeEventHeader;

        // check to make sure the change event is for the configured sobject and the record event is CREATE and the Opportunity is Closed Won
        if (
            this.sobject.toLowerCase() !== entityName.toLowerCase() ||
            changeType !== 'CREATE' ||
            data.StageName !== 'Closed Won'
        ) {
            return;
        }

        //add latest amount to the totalAmount
        this.totalAmount += data.Amount;

        //update gauge chart to reflect updated amount
        this.chart.set(this.totalAmount);
    }
}
