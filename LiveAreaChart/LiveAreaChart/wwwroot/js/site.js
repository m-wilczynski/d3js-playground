const areaChart = (function() {

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

    let data = [];
    let applications = new Map();

    function populateData(rawData) {

        data = [];
        applications = groupRawDataByApplicationName(rawData);

        //TODO: Optimize - produce on grouping
        for ([applicationName, applicationHealthchecks] of applications) {
    
            const successDateBucket = new Map();
            const failureDateBucket = new Map();
    
            applicationHealthchecks.forEach(healthCheck => {
    
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
    
            data.push(
            {
                key: applicationName,
                successSeries: Array.from(successDateBucket.values()),
                errorSeries: Array.from(failureDateBucket.values())
            });
        }
    }

    populateData(rawData);

    function groupRawDataByApplicationName(rawData) {
        const map = new Map();
        for (let element of rawData) {
            if (map.get(element.applicationName) === undefined) {
                map.set(element.applicationName, []);
            }
            map.get(element.applicationName).push(element);
        }
        return map;
    }

    const x = d3.scaleTime()
        .domain(d3.extent(data[0].successSeries, d => d.date))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data[0].successSeries, d => d.value)]).nice()
        .range([height - margin.bottom, margin.top]);

    const xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x)
            .tickFormat(d3.timeFormat("%H:%M:%S"))
            .ticks(7));

    const yAxis = (g, applicationName) => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(8))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 17)
        .attr("y", -10)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(applicationName));

    const successArea = d3.area()
        .curve(d3.curveBasisOpen)
        .x(d => x(d.date))
        .y0(y(0))
        .y1(d => y(d.value));

    const failureArea = d3.area()
        .curve(d3.curveBasisOpen)
        .x(d => x(d.date))
        .y0(y(0))
        .y1(d => y(d.value));   

    function draw() {
        
        for (let applicationIndex in data) {

            const application = data[applicationIndex];

            const container = d3
                .select('#root-container')
                .append('div')
                .attr('id', `chart-container-${applicationName}`)
                .attr('class', `chart-container`)
                .attr('height', height)
                .attr('width', width); 
        
            const svg = container
                .append("svg")
                .attr("viewBox", [0, 0, width, height])
                .attr('height', height)
                .attr('width', width);
            
            svg.append("path")
                .datum(application.successSeries)
                .attr("fill", color(false))
                .attr("d", successArea);

            svg.append("path")
                .datum(application.errorSeries)
                .attr("fill", color(true))
                .attr("d", failureArea);
            
            svg.append("g")
                .attr("class", "x-axis")
                .call(xAxis);
            
            svg.append("g")
                .call(yAxis, application.key);
            
            //return svg.node();
        }
    }

    return {
        draw: draw,
        getData: Array.from(data)
    }

})();