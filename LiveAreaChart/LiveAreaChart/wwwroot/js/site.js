const areaChart = (function() {

    let initialized = false;

    const margin = ({top: 20, right: 20, bottom: 30, left: 30});
    const width = 600;
    const height = 200;
    const color = isErrorSeries => {
        if (isErrorSeries === false) {
            return '#6edb75b5';
        } else {
            return '#ff4040b5';
        }
    };

    let data = {};
    let chartConfig = {};
    let application = {};

    function fetchData(applicationId) {
        return axios.get(`/api/healthchecks/get-latest/${applicationId}`);
    }

    function sanitizeData(rawData) {
      
        const applicationId = rawData[0].applicationId;

        const successDateBucket = new Map();
        const failureDateBucket = new Map();

        rawData.forEach(healthCheck => {

            const normalizedDate = new Date(healthCheck.checkTime);
            normalizedDate.setSeconds(Math.floor(normalizedDate.getSeconds()/10)*10, 0);
            
            if (healthCheck.success) {

                if (successDateBucket.get(normalizedDate.getTime()) === undefined) {
                    successDateBucket.set(normalizedDate.getTime(), {
                        date: normalizedDate,
                        value: 1
                    });
                }
                successDateBucket.get(normalizedDate.getTime()).value += 1;
            } else {
                if (failureDateBucket.get(normalizedDate.getTime()) === undefined) {
                    failureDateBucket.set(normalizedDate.getTime(), {
                        date: normalizedDate,
                        value: 1
                    });
                }
                failureDateBucket.get(normalizedDate.getTime()).value += 1;
            }
        });

        return {
            applicationId: applicationId,
            successSeries: Array.from(successDateBucket.values()),
            errorSeries: Array.from(failureDateBucket.values())
        };
    }

    function buildConfiguration(sanitizedData) {

        const config = {
            x: d3.scaleTime()
                .domain(d3.extent(sanitizedData.successSeries, d => d.date))
                .range([margin.left, width - margin.right]),

            y: d3.scaleLinear()
                .domain([0, d3.max(sanitizedData.successSeries, d => d.value)]).nice()
                .range([height - margin.bottom, margin.top])
        };

        config.xAxis = g => g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(config.x)
                .tickFormat(d3.timeFormat("%H:%M:%S"))
                .ticks(7));

        config.yAxis = (g, applicationId) => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(config.y).ticks(8))
            .call(g => g.select(".domain").remove())
            .call(g => g.select(".tick:last-of-type text").clone()
                .attr("x", 17)
                .attr("y", -10)
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .text(applicationId)
            );

        config.successArea = d3.area()
            .curve(d3.curveStep)
            .x(d => config.x(d.date))
            .y0(config.y(0))
            .y1(d => config.y(d.value));

        config.failureArea = d3.area()
            .curve(d3.curveStep)
            .x(d => config.x(d.date))
            .y0(config.y(0))
            .y1(d => config.y(d.value));

        return Object.freeze(config);
    }
    
    function refresh(applicationId) {
        fetchData(applicationId).then(_ => sanitizeData(_.data));
    }

    function initialize(applicationId) {
        
        if (initialized) { throw 'Already initialized'; }

        application = { applicationId: applicationId };

        fetchData(applicationId)
            .then(_ => { 
                data = sanitizeData(_.data);
                chartConfig = buildConfiguration(data);
                
                const container = d3
                    .select('#root-container')
                    .append('div')
                    .attr('id', `chart-container-${data.applicationId}`)
                    .attr('class', `chart-container`)
                    .attr('height', height)
                    .attr('width', width); 
            
                const svg = container
                    .append("svg")
                    .attr("viewBox", [0, 0, width, height])
                    .attr('height', height)
                    .attr('width', width);
                
                svg.append("path")
                    .datum(data.successSeries)
                    .attr("fill", color(false))
                    .attr("d", chartConfig.successArea);

                svg.append("path")
                    .datum(data.errorSeries)
                    .attr("fill", color(true))
                    .attr("d", chartConfig.failureArea);
                
                svg.append("g")
                    .attr("class", "x-axis")
                    .call(chartConfig.xAxis);
                
                svg.append("g")
                    .call(chartConfig.yAxis, data.applicationId);

                this.initialized = true;
            });
        
        //return svg.node();
    }

    return {
        refresh: refresh,
        initialize: initialize,
        currentData: Array.from(data),
    }

})();