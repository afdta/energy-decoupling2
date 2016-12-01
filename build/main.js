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
						   sort: dat.sort[p],
						   state:dat.trends[p][0].state==dat.fuel[p][0].state ? dat.trends[p][0].state : "Error"});
			}
		}

		var graphic_wrap = d3.select("#energy-decoupling-graphic");
		var svg_wrap = graphic_wrap.append("div").style("margin","0px auto");
		var svg = svg_wrap.append("svg").style("width","100%");
		

		var plots = {width:190, height:170};

		//function to return available width for grid
		var width_avail = function(cols){
			if(!!cols){
				return dimensions(wrap.node(), 5*plots.width).width;
			}
			else{
				return dimensions(wrap.node()).width;
			}
			
		}

		var grid = grid_layout().cell_dims(plots.width, plots.height).ncells(51).padding(5,5,5,15);

		//scales - line chart
		var year_scale = d3.scaleLinear().domain([2000, 2014]).range([25, plots.width-45]);
		var val_scale = d3.scaleLinear().domain([60,220]).range([plots.height-20, 15]);
		

		//line generators
		var index_line_gdp = d3.line().x(function(d){return year_scale(d.year)})
								      .y(function(d){return val_scale(d.GDPi)});
		
		var index_line_co2 = d3.line().x(function(d){return year_scale(d.year)})
								      .y(function(d){return val_scale(d.CO2i)});

		//axis generators
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

		//scales - bar chart
		var fuel_scale = d3.scaleBand().domain(["coal", "natgas", "nuclear", "hydro", "windsolar", "other"])
									 .range([30,plots.height-14])
									 .paddingInner(0.25)
									 .paddingOuter(0)
									 ;

		var bar_scale = d3.scaleLinear().domain([0,1]).range([0,plots.width-20]);
		var colorbrewer= ['#66c2a5','#fc8d62','#8da0cb','#e78ac3','#a6d854','#ffd92f']
		var fuel_color = function(d){
			var cols = {
				coal:colorbrewer[1], 
			 	natgas: colorbrewer[5], 
			 	nuclear:colorbrewer[3], 
			 	hydro: colorbrewer[0], 
			 	windsolar: colorbrewer[4], 
			 	other:colorbrewer[2]
			}
			return cols[d];
		}
		var fuel_color_text = function(d){
			return d=="windsolar" ? "#666666" : "#ffffff";
		}

		//bar stack generator
		var stack_keys = ["coal", "natgas", "nuclear", "hydro", "windsolar", "other"];
		var stack = d3.stack().keys(stack_keys).value(function(d, key){return bar_scale(d[key].share)});

		var sortkey = "diff";				
		function draw_plots(){
			plots.u = svg.selectAll("g.grid-cell").data(data, function(d,i){return d.state});
			plots.u.exit().remove();
			plots.e = plots.u.enter().append("g").classed("grid-cell",true);
			  var shift = plots.e.append("g").classed("v-shift",true);
				  shift.append("rect").classed("background",true);
				  shift.append("text").classed("state-label",true).attr("x", "10")
				  						.attr("y", "30")
				  						.text(function(d,i){return d.state})
				  						.attr("text-anchor","start")
				  						.style("font-size","15px")
				  						.style("font-weight","normal")
				  						;

				  
		 		  var lp = shift.append("g").classed("line-plot",true);
		 		  	  lp.append("g").classed("grid-lines",true);
				  	  lp.append("g").classed("x-axis",true).attr("transform","translate(0,"+(plots.height-15)+")");
				  	  lp.append("g").classed("y-axis",true).attr("transform","translate(15,0)");
				  
				  shift.append("g").classed("bar-chart",true).attr("transform","translate(10,0)")
				  	   .append("line").attr("x1",-1).attr("x2",-1)
				  	   				  .attr("y1",40).attr("y2",(plots.height-0))
				  	   				  .attr("stroke-width",1)
				  	   				  .attr("stroke","#aaaaaa")
				  	   				  .style("shape-rendering","crispEdges")
				  	   ;


			plots.b = plots.e.merge(plots.u);
			
			plots.shift = plots.b.select("g.v-shift");
			plots.line = plots.shift.select("g.line-plot");
			plots.bar = plots.shift.select("g.bar-chart");
			
			plots.shift.select("text.state-label").text(function(d,i){return (i+1)+". "+d.state});

			/*var rects = shift.select("rect")
							   .attr("width",plots.width-10)
							   .attr("height",plots.height-35)
							   .attr("fill","#ffff00")
							   .attr("x","5")
							   .attr("y","40");*/


			
			//add y-axis
			var yg = plots.line.select("g.y-axis");
			yaxis(yg);
			yg.selectAll("path").attr("stroke","none");
			yg.selectAll("line").style("shape-rendering","crispEdges");
			yg.selectAll("text").attr("fill","#666666");

			//add x-axis
			var xg = plots.line.select("g.x-axis");
			xaxis(xg);
			xg.selectAll("path").attr("stroke","none");
			xg.selectAll("line").style("shape-rendering","crispEdges");
			xg.selectAll("text").attr("fill","#666666");

			//style axes
			plots.line.select("g.grid-lines")
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


			plots.line.selectAll("path.trend-line").data(function(d,i){
				return [index_line_gdp(d.trend), index_line_co2(d.trend)];
			}).enter().append("path").classed("trend-line", true).attr("d", function(d,i){return d})
									 .attr("stroke", function(d,i){
									 	return i === 0 ? "#222222" : "#222222";
									 })
									 .attr("stroke-dasharray", function(d,i){
									 	return i === 0 ? "none" : "3,3";
									 })
									 .attr("stroke-width","2px")
									 .attr("fill", "none")
									 ;

			var labels = plots.line.selectAll("g.value-label").data(function(d,i){
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





			var bars = { };
			bars.u = plots.bar.selectAll("g.bars").data(function(d){
				/*var D = {year:2014};
				for(var i=0; i<d.fuel.length; i++){
					D[d.fuel[i].fuel] = d.fuel[i];
				}
				var keys = stack_keys.slice(0);
				var key = sortkey.replace("share_", "");
				keys.sort(function(a,b){ 
					if(a==key){return -1}
					else if(b==key){return 1}
					else{return 0}
				})
				stack.keys(keys);

				var s = stack([D]);
				return(s);*/
				return d.fuel.slice(0).sort(function(a,b){
					var aval = "share_" + a.fuel;
					var bval = "share_" + b.fuel;
					if(aval == sortkey){return -1}
					else if(bval == sortkey){return 1}
					else{return 0}
					//else{return b.share - a.share}
				});
			});
			bars.e = bars.u.enter()
			  .append("g")
			  .classed("bars", true)
			  ;
			bars.e.append("rect");
			bars.e.append("text").classed("fuel-type",true);
			bars.e.append("text").classed("fuel-share",true);
			  //.attr("transform","translate(5,35)");
			bars.b = bars.e.merge(bars.u);
			bars.b.attr("transform", function(d,i){
				return "translate(0," + ((i*19)+45) + ")"; 
			})

			/*var segments = {};
			segments.u = bars.b.selectAll("g")
			  .data(function(D){
			  	var key = D.key;
			  	var index = D.index;
			  	return D.map(function(d,i){
			  		return {start:d[0], end:d[1], value: d.data[key].share, fuel: key}
			  	})
			  });
			segments.e = segments.u.enter().append("g");
				segments.e.append("rect");
				segments.e.append("text");
				segments.e.append("text");
			segments.b = segments.e.merge(segments.u)
				.attr("transform", function(d,i){
					return "translate("+d.start+",0)";
				});*/

			bars.b.select("rect")
				.attr("height",14)
				.attr("width", function(d,i){return bar_scale(d.share)})
				.attr("x", function(d,i){return 0})
				.attr("y", function(d,i){return 0})
				.attr("fill",function(d,i){return fuel_color(d.fuel)})
				;

			/*var blabels = {};
			blabels.u = segments.b.selectAll("text").data(function(d,i){return [d]});
			blabels.e = blabels.u.enter().append("text");
			blabels.b = blabels.e.merge(blabels.u)*/

			bars.b.select("text.fuel-share")
				.text(function(d,i){return d.fuel_type + ": " +(Math.round(d.share*1000)/10)+"%"})
				.style("font-size","11px")
				.attr("text-anchor","start")
				.attr("x",function(d,i){
					return 2; 
					//bar_scale(d.share) + 5
				})
				.attr("y","11")
				//.attr("fill", function(d,i){return d.share > 0.05 ? "#333333" : "#666666"})
				//.style("font-weight", function(d,i){return sortkey == ("share_"+d.fuel) ? "bold" : "normal"})
				//.style("visibility", function(d,i){return d.value >= 0.05 ? "visible" : "hidden"})

		}

		var control_outer = d3.select("#energy-decoupling-control")
				.style("min-width", "250px")
				.style("margin","0px auto")
				.style("padding","1em 2em 1em 1em");

		var resize_timer;
		function lay_it_out(){

			var fivecolwidth = width_avail(5);

			grid.set_width(fivecolwidth+20)	

			svg.style("height", grid.get_height()+"px");
			svg_wrap.style("width", grid.get_width()+"px");

			var extra = width_avail() - grid.get_width();
			
			if(extra > 350){
				control_outer.style("float","left").style("width","350px");
				svg_wrap.style("float","left").style("width", grid.get_width()+"px");
			}
			else{
				control_outer.style("float","none").style("width","auto");
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

		//plot control

		//control_outer.append("div").style("margin-bottom","2em").append("img").style("width","306px").attr("src","./build/legend.png");

		var sortby = {};
		

		var control = control_outer.append("div").style("padding","1em").style("border","1px solid #dddddd");

		control.append("p").style("margin","0em 0em 0em 0em").append("strong").text("Order charts by");

		sortby.diff = control.append("p").text("Percentage point difference between GDP and emissions growth, 2000–14").classed("sortby selected",true).datum("diff");
		sortby.gdp = control.append("p").text("Change in real GDP, 2000–14").classed("sortby",true).datum("gdp");
		sortby.co2 = control.append("p").text("Change in emissions, 2000–14").classed("sortby",true).datum("co2");
		//sortby.state = control.append("p").text("State name").classed("sortby",true).datum("state");

		control.append("p").style("margin","2em 0em 0em 0em").style("font-size","0.9em").append("em")
				.text("Share of 2014 net electricity generation from:");
		sortby.coal = control.append("p").text("Coal").classed("sortby",true).datum("share_coal");
		sortby.gas = control.append("p").text("Natural gas").classed("sortby",true).datum("share_natgas");
		sortby.nuclear = control.append("p").text("Nuclear").classed("sortby",true).datum("share_nuclear");
		sortby.nuclear = control.append("p").text("Hydro").classed("sortby",true).datum("share_hydro");
		sortby.nuclear = control.append("p").text("Wind and solar").classed("sortby",true).datum("share_windsolar");

		var sortbuttons = control.selectAll("p.sortby");

		function sort_and_draw(key){
			sortkey = key;
			data.sort(function(a,b){
				var aval = a.sort[0][key];
				var bval = b.sort[0][key];
				var comp =  aval >= bval ? -1 : 1; 
				if(key=="state" || key=="co2"){
					return comp*(-1);
				}
				else{
					return comp;
				}
			});

			draw_plots();
			lay_it_out();

			if(sortkey in {diff:1, co2:1, gdp:1}){
				plots.bar.style("display","none");
				plots.line.style("display","inline");
			}
			else{
				plots.bar.style("display","inline");
				plots.line.style("display","none");
			}			
		}

		sortbuttons.on("mousedown", function(d,i){
			sort_and_draw(d);
			sortbuttons.classed("selected",false);
			d3.select(this).classed("selected",true);
		});

		sort_and_draw("diff");
		
		window.addEventListener("resize", lay_it_out)


	});
}

document.addEventListener("DOMContentLoaded", function(){
	mainfn();
});