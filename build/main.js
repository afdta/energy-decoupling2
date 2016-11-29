//gig economy interactive - oct 2016

import card from '../../js-modules/card-api.js';
import state_select from '../../js-modules/state-select.js';
import history from '../../js-modules/history.js';
import dir from '../../js-modules/rackspace.js';
import grid_layout from '../../js-modules/grid-layout.js';
import dimensions from '../../js-modules/dimensions.js';

dir.local();
dir.add("data");

function mainfn(){
	var state = history();
	var url = dir.url("data", "energy_decoupling.json");
	
	var wrap = d3.select("#energy-decoupling").style("max-width","1365px").style("margin","0px auto");
	d3.json(url, function(err,dat){
		var data = [];
		for(var p in dat.trends){
			if(dat.trends.hasOwnProperty(p)){
				data.push({trend: dat.trends[p], 
						   fuel: dat.fuel[p], 
						   state:dat.trends[p][0].state==dat.fuel[p][0].state ? dat.trends[p][0].state : "Error"});
			}
		}

		var graphic_wrap = d3.select("#energy-decoupling-graphic");
		var svg_wrap = graphic_wrap.append("div").style("margin","0px auto");
		var svg = svg_wrap.append("svg").style("width","100%");
		

		var plots = {width:190, height:180};

		var width_avail = function(cols){
			if(!!cols){
				return dimensions(wrap.node(), 5*plots.width).width;
			}
			else{
				return dimensions(wrap.node()).width;
			}
			
		}

		var grid = grid_layout().cell_dims(plots.width, plots.height).ncells(51).padding(5,5,5,15);

		plots.u = svg.selectAll("g").data(data);
		plots.u.exit().remove();
		plots.e = plots.u.enter().append("g");
		  var shift = plots.e.append("g").classed("v-shift",true);
		  shift.append("rect");
		  shift.append("text").attr("x", "10")
		  						.attr("y", "30")
		  						.text(function(d,i){return d.state})
		  						.attr("text-anchor","start")
		  						.style("font-size","15px")
		  						.style("font-weight","normal")
		  						;

		  shift.append("g").classed("grid-lines",true).attr("transform","translate(0,10)");
		  shift.append("g").classed("line-plot",true).attr("transform","translate(0,10)");
		  shift.append("g").classed("bar-chart",true).attr("transform","translate(0,5)");
		  shift.append("g").classed("x-axis",true).attr("transform","translate(0,"+(plots.height-15)+")");
		  shift.append("g").classed("y-axis",true).attr("transform","translate(15,10)");

		plots.b = plots.e.merge(plots.u);

		/*var rects = shift.select("rect")
						   .attr("width",plots.width-10)
						   .attr("height",plots.height-35)
						   .attr("fill","#ffff00")
						   .attr("x","5")
						   .attr("y","40");*/

		var line_plot = shift.select("g.line-plot");
		var bar_chart = shift.select("g.bar-chart");

		//lines
		var year_scale = d3.scaleLinear().domain([2000, 2014]).range([25, plots.width-45]);
		var val_scale = d3.scaleLinear().domain([60,220]).range([plots.height-20, 15]);
		var index_line_gdp = d3.line().x(function(d){return year_scale(d.year)})
								      .y(function(d){return val_scale(d.GDPi)});
		
		var index_line_co2 = d3.line().x(function(d){return year_scale(d.year)})
								      .y(function(d){return val_scale(d.CO2i)});

		var yaxis = d3.axisLeft(val_scale)
					  .tickValues([75,100,125,150,175])
					  .tickFormat(function(v){return Math.round(v*10)/10;})
					  .tickSize(3)
					  .tickSizeOuter(0);

		var xaxis = d3.axisBottom(year_scale)
					  .tickValues([2000,2005,2010,2014])
					  .tickFormat(function(v){
					  	return v==2000 ? v : "'" + (v+"").substring(2);
					  })
					  .tickSize(3)
					  .tickSizeOuter(0);
		
		var yg = shift.select("g.y-axis");
		yaxis(yg);
		yg.selectAll("path").attr("stroke","none");
		yg.selectAll("line").style("shape-rendering","crispEdges");
		yg.selectAll("text").attr("fill","#666666");

		var xg = shift.select("g.x-axis");
		xaxis(xg);
		xg.selectAll("path").attr("stroke","none");
		xg.selectAll("line").style("shape-rendering","crispEdges");
		xg.selectAll("text").attr("fill","#666666");


		shift.select("g.grid-lines")
				.selectAll("line")
				.data(yaxis.tickValues())
				.enter()
				.append("line")
				.attr("y1",function(d,i){
					return val_scale(d);
				})
				.attr("y2",function(d,i){
					return val_scale(d);
				})
				.attr("x1",10)
				.attr("x2",plots.width-15)
				.attr("stroke","#bbbbbb")
				.style("shape-rendering","crispEdges")
				.attr("stroke-dasharray","2,2")
				;


		line_plot.selectAll("path").data(function(d,i){
			return [index_line_gdp(d.trend), index_line_co2(d.trend)];
		}).enter().append("path").attr("d", function(d,i){return d})
								 .attr("stroke", function(d,i){
								 	return i === 0 ? "#222222" : "#222222";
								 })
								 .attr("stroke-dasharray", function(d,i){
								 	return i === 0 ? "none" : "3,3";
								 })
								 .attr("stroke-width","2px")
								 .attr("fill", "none")
								 ;

		var labels = line_plot.selectAll("g.value-label").data(function(d,i){
			var len = d.trend.length;
			return [d.trend[len-1], d.trend[len-1]];
		}).enter().append("g").classed("value-label",true)
		.attr("transform", function(d,i){
			return "translate(" + year_scale(d.year) + "," + val_scale(i==0 ? d.GDPi : d.CO2i) + ")";
		});

		labels.append("circle")
		  .attr("r",3)
		  .attr("cx","0")
		  .attr("cy","0")
		  .attr("fill", "#222222")
		;

		labels.append("text")
			  .attr("x",0)
			  .attr("y",0)
			  .text(function(d,i){
			  	var v = i==0 ? d.GDPi : d.CO2i
			  	return Math.round(v*10)/10;
			  })
			  .style("font-size","11px")
			  .attr("dx",5)
			  .attr("dy", function(d,i){
			  	if(i==0 ){
			  		return d.GDPi >= d.CO2i ? "-3px" : "7px";
			  	}
			  	else{
			  		return d.CO2i > d.GDPi ? "-3px" : "7px";
			  	}
			  });



		//bars
		var fuel_scale = d3.scaleBand().domain(["coal", "natgas", "nuclear", "hydro", "windsolar", "other"])
									 .range([30,plots.height-14])
									 .paddingInner(0.25)
									 .paddingOuter(0)
									 ;

		var bar_scale = d3.scaleLinear().domain([0,1]).range([0,plots.width-20]);
		var fuel_color = function(d){
			var cols = {
				coal:"#e41a1c", 
			 	natgas: "#ff7f00", 
			 	nuclear:"#4daf4a", 
			 	hydro: "#377eb8", 
			 	windsolar: "#ffff33", 
			 	other:"#666666"
			}
			return cols[d];
		}
		var stack = d3.stack().keys(["coal", "natgas", "nuclear", "hydro", "windsolar", "other"])
							  .value(function(d, key){return bar_scale(d[key].share)});

		bar_chart.selectAll("g.series").data(function(d){
			var D = {year:2014};
			for(var i=0; i<d.fuel.length; i++){
				D[d.fuel[i].fuel] = d.fuel[i];
			}
			var s = stack([D]);
			return(s);
		}).enter()
		  .append("g")
		  .classed("series", true)
		  .attr("transform","translate(5,35)")
		  .selectAll("rect")
		  .data(function(D){
		  	var key = D.key;
		  	var index = D.index;
		  	return D.map(function(d,i){
		  		return {start:d[0], end:d[1], value: d.data[key].share, fuel: key}
		  	})
		  }).enter().append("rect")
			.attr("height",10)
			.attr("width", function(d,i){return d.end-d.start})
			.attr("x", function(d,i){return d.start})
			.attr("y", function(d,i){return 0})
			.attr("fill",function(d,i){return fuel_color(d.fuel)});

		var control = d3.select("#energy-decoupling-control").style("min-width", "250px")
															 .style("min-height","250px")
															 ;
		var resize_timer;
		function lay_it_out(){

			var fivecolwidth = width_avail(5);

			grid.set_width(fivecolwidth+20)	

			svg.style("height", grid.get_height()+"px");
			svg_wrap.style("width", grid.get_width()+"px");

			var extra = width_avail() - grid.get_width();
			
			if(extra > 350){
				control.style("float","left").style("width","350px");
				svg_wrap.style("float","left").style("width", grid.get_width()+"px");
			}
			else{
				control.style("float","none").style("width","auto");
				svg_wrap.style("float","none").style("width",grid.get_width()+"px");
			}

			clearTimeout(resize_timer);
			resize_timer = setTimeout(function(){
				plots.b.transition().duration(1000).attr("transform", function(d,i){
					var xy = grid.layout(i);
					return "translate(" + xy.x + "," + xy.y + ")"
				}).on("start", function(d,i){
					var thiz = d3.select(this);
					var xy = grid.layout(i);
					thiz.select("g.y-axis").style("visibility", xy.col==0 ? "visible" : "hidden");
					thiz.select("g.x-axis").style("visibility", xy.row%3==0 ? "visible" : "hidden");
					thiz.select("g.v-shift").attr("transform","translate(0," + (xy.row%3 != 0 ? "10)" : "0)"));
				})
			}, 150);


		}

		lay_it_out();

		
		window.addEventListener("resize", lay_it_out)


	});
}

document.addEventListener("DOMContentLoaded", function(){
	mainfn();
});