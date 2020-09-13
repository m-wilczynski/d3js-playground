const areaChart = (function() {

    const margin = ({top: 20, right: 20, bottom: 30, left: 30});
    const width = 600;
    const height = 270;
    const color = isErrorSeries => {
        if (isErrorSeries === false) {
            return '#6edb75b5';
        } else {
            return '#ff4040b5';
        }
    };

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

    const applications = groupRawDataByApplicationName(rawData);

    const data = [];
    
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
            errorSeries: false,
            values: Array.from(successDateBucket.values())
        },
        {
            key: applicationName,
            errorSeries: true,
            values: Array.from(failureDateBucket.values())
        });
    }

    const x = d3.scaleTime()
        .domain(d3.extent(data[0].values, d => d.date))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data[0].values, d => d.value)]).nice()
        .range([height - margin.bottom, margin.top]);

    const xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x)
            .tickFormat(d3.timeFormat("%H:%M:%S"))
            .ticks(8));

    const yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(data[0].key));

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
        
        const container = d3
            .select('body')
            .append('div')
            .attr('class', 'chart-container')
            .attr('height', height)
            .attr('width', width); 
    
        const svg = container
            .append("svg")
            .attr("viewBox", [0, 0, width, height])
            .attr('height', height)
            .attr('width', width);
          
        svg.append("path")
            .datum(data[0].values)
            .attr("fill", color(data[0].errorSeries))
            .attr("d", successArea);

        svg.append("path")
            .datum(data[1].values)
            .attr("fill", color(data[1].errorSeries))
            .attr("d", failureArea);
        
        svg.append("g")
            .attr("class", "x-axis")
            .call(xAxis);
        
        svg.append("g")
            .call(yAxis);
        
        return svg.node();
    }

    return {
        draw: draw,
        getData: Array.from(data)
    }

})();