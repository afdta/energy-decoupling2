//gig economy interactive - oct 2016

import card from '../../js-modules/card-api.js';
import state_select from '../../js-modules/state-select.js';
import history from '../../js-modules/history.js';
import dir from '../../js-modules/rackspace.js';
import grid_layout from '../../js-modules/grid-layout.js';
import dimensions from '../../js-modules/dimensions.js';
import format from '../../js-modules/formats.js';

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
						   pc: dat.percap[p][0],
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
		var val_scale = d3.scaleLinear().domain([50,220]).range([plots.height-20, 15]);
		

		//line generators
		var index_line_gdp = d3.line().x(function(d){return year_scale(d.year)})
								      .y(function(d){return val_scale(d.GDPi)});
		
		var index_line_co2 = d3.line().x(function(d){return year_scale(d.year)})
								      .y(function(d){return val_scale(d.CO2i)});

		//axis generators
		var yaxis = d3.axisLeft(val_scale)
					  .tickValues([75,100,125,150,175])
					  .tickSize(3)
					  .tickSizeOuter(0);

		var xaxis = d3.axisBottom(year_scale)
					  .tickValues([2000,2005,2010,2014])
					  .tickFormat(function(v){
					  	return v==2000 ? v : "'" + (v+"").substring(2);
					  })
					  .tickSize(3)
					  .tickSizeOuter(0);

		//scale - per capita bar chart
		var pc_scale = d3.scaleLinear().domain([0, 128]).range([(plots.height-25), 0]);
		var pc_year_scale = d3.scaleBand().domain([2000, 2014]).range([20, plots.width-20])
											.paddingOuter(0.25)
											.paddingInner(0.25);

		var pc_xaxis =  d3.axisBottom(pc_year_scale)
					  .tickValues([2000,2014])
					  .tickSize(3)
					  .tickSizeOuter(0);
		
		var pc_yaxis = d3.axisLeft(pc_scale)
					  .tickValues([0,20,40,60,80])
					  .tickFormat(function(v){return Math.round(v)})
					  .tickSize(3)
					  .tickSizeOuter(0);

		//scales - fuel mixbar chart
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
		var formats = {
			diff: format.fn0("pct1"),
			gdp: format.fn0("pct1"),
			co2: format.fn0("pct1"),
			chg: function(v){return format.fn(v, "ch1")},
			pct_chg: format.fn0("pct1"),
			co2_pc_2014: format.fn0("num1"),
			share_coal: format.fn0("sh1"),
			share_natgas: format.fn0("sh1"),
			share_nuclear: format.fn0("sh1"),
			share_hydro: format.fn0("sh1"),
			share_windsolar: format.fn0("sh1")
		}


		function draw_plots(){
			plots.u = svg.selectAll("g.grid-cell").data(data, function(d,i){return d.state});
			plots.u.exit().remove();
			plots.e = plots.u.enter().append("g").classed("grid-cell",true);
			  var shift = plots.e.append("g").classed("v-shift",true).attr("transform","translate(0,0)");
				  shift.append("rect").classed("background",true);

				  var pc = shift.append("g").classed("pc-plot",true);
				  	  pc.append("g").classed("grid-lines",true);
				  	  pc.append("g").classed("y-axis",true).attr("transform","translate(15,0)");
				  	  pc.append("g").classed("x-axis",true).attr("transform","translate(0,"+(plots.height-20)+")");

		 		  var lp = shift.append("g").classed("line-plot",true);
		 		  	  lp.append("g").classed("grid-lines",true);
				  	  lp.append("g").classed("x-axis",true).attr("transform","translate(0,"+(plots.height-25)+")");
				  	  lp.append("g").classed("y-axis",true).attr("transform","translate(15,0)");
				  	  lp.append("g").classed("path-labels",true).style("visibility","hidden");

				  shift.append("g").classed("bar-chart",true).attr("transform","translate(10,0)")
				  	   .append("line").attr("x1",-1).attr("x2",-1)
				  	   				  .attr("y1",40).attr("y2",(plots.height-0))
				  	   				  .attr("stroke-width",1)
				  	   				  .attr("stroke","#aaaaaa")
				  	   				  .style("shape-rendering","crispEdges")
				  	   ;

				  shift.append("g").classed("state-labels",true);





			plots.b = plots.e.merge(plots.u);
			
			plots.shift = plots.b.select("g.v-shift");
			plots.line = plots.shift.select("g.line-plot");
			plots.line_labels = plots.line.select("g.path-labels");
			plots.bar = plots.shift.select("g.bar-chart");
			plots.pc = plots.shift.select("g.pc-plot").attr("transform","translate(0,-5)");
			
			var stlabels = plots.shift.select("g.state-labels").selectAll("text.state-label").data(function(d,i){
				var st = d.state == "District of Columbia" ? "D.C." : d.state;
				return [
						{state:st, val:formats[sortkey](d.sort[0][sortkey]), rank:i+1},
						{state:st, val:formats[sortkey](d.sort[0][sortkey]), rank:i+1}
					];
			});
			stlabels.enter().append("text").classed("state-label",true).merge(stlabels)
			  			.attr("x", "1")
  						.attr("y", "30")
  						.attr("text-anchor","start")
  						.style("font-size","15px")
  						.style("font-weight","bold")
  						.attr("stroke", function(d,i){return i==0 ? "#ffffff" : "none"})
  						.attr("stroke-width", function(d,i){return i==0 ? "3" : "0"})
  						.html(function(d,i){
							return "<tspan>"+d.rank+". </tspan> "+ d.state + " <tspan> (" + d.val + ")</tspan>";
						});

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
						return (val_scale(d)+0.5);
					})
					.attr("y2",function(d,i){
						return (val_scale(d)+0.5);
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
				  	return format.fn(v, "num1")
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

			var anno = plots.line_labels.style("visibility","hidden").selectAll("text").data(function(d,i){
				var gdp = d.trend[4];
				var co2 = sortkey == "co2" ? d.trend[11] : d.trend[9];
				var cy = sortkey == "co2" ? val_scale(co2.CO2i)-7 : val_scale(co2.CO2i)+15
				var g = {x:year_scale(gdp.year), y:val_scale(gdp.GDPi)-7, text:"GDP"};
				var c = {x:year_scale(co2.year), y:cy, text:"Emissions"};
				return [g,c]
			});
			anno.enter().append("text").merge(anno)
				.attr("x", function(d,i){return d.x})
				.attr("y", function(d,i){return d.y})
				.text(function(d,i){return d.text})
				.attr("text-anchor","middle")
				.style("font-size","13px")
				;



			//PER CAPITA COLUMN CHARTS


			var pcbars = {};
			pcbars.u = plots.pc.selectAll("g.bars").data(function(d){
				return [{year:2000, val: d.pc.co2_pc_2000}, {year:2014, val: d.pc.co2_pc_2014}];
			});
			pcbars.e = pcbars.u.enter().append("g").classed("bars",true);
				pcbars.e.append("rect");
				pcbars.e.append("text");
			pcbars.b = pcbars.e.merge(pcbars.u).attr("transform", function(d,i){
				return "translate(" + pc_year_scale(d.year) + ",0)";
			})

			pcbars.b.select("rect").attr("x","0")
								 .attr("width",pc_year_scale.bandwidth())
								 .attr("height", function(d){return (plots.height-25) - pc_scale(d.val)})
								 .attr("y", function(d){return pc_scale(d.val)})
								 .attr("fill", fuel_color("windsolar"))
								 ;

			pcbars.b.select("text").attr("x",pc_year_scale.bandwidth()/2)
								   .attr("y",function(d,i){
								   		var below = pc_scale(d.val)+12;
								   		var above = pc_scale(d.val)-2;
								   		return d.val < 70 ? above : below;

								   	})
								   .text(function(d,i){return format.fn(d.val, "num1")})
								   .attr("text-anchor","middle")
								   .style("font-size","11px")

								   ;

			//add y-axis
			var pcyg = plots.pc.select("g.y-axis");
			pc_yaxis(pcyg);
			pcyg.selectAll("path").attr("stroke","none");
			pcyg.selectAll("line").style("shape-rendering","crispEdges");
			pcyg.selectAll("text").attr("fill","#666666");

			//add x-axis
			var pcxg = plots.pc.select("g.x-axis");
			pc_xaxis(pcxg);
			pcxg.selectAll("path").attr("stroke","none");
			pcxg.selectAll("line").style("shape-rendering","crispEdges");
			pcxg.selectAll("text").attr("fill","#666666");

			plots.pc.select("g.grid-lines")
					.selectAll("line")
					.data(pc_yaxis.tickValues())
					.enter()
					.append("line")
					.attr("y1",function(d,i){
						return (pc_scale(d)+0.5);
					})
					.attr("y2",function(d,i){
						return (pc_scale(d)+0.5);
					})
					.attr("x1",10)
					.attr("x2",plots.width-15)
					.attr("stroke","#bbbbbb")
					.style("shape-rendering","crispEdges")
					.attr("stroke-dasharray",function(d,i){return d==0 ? "none" : "2,2"})
					;


			var bars = { };
			bars.u = plots.bar.selectAll("g.bars").data(function(d){
				return d.fuel.slice(0).sort(function(a,b){
					var aval = "share_" + a.fuel;
					var bval = "share_" + b.fuel;
					if(aval == sortkey){return -1}
					else if(bval == sortkey){return 1}
					else{return 0}
				});
			}, function(d){return d.fuel});

			bars.e = bars.u.enter()
			  .append("g")
			  .classed("bars", true)
			  ;
			bars.e.append("rect");
			bars.e.append("text").classed("fuel-type",true);
			bars.e.append("text").classed("fuel-share",true);
			bars.b = bars.e.merge(bars.u);
			bars.b.transition().attr("transform", function(d,i){
				return "translate(0," + ((i*19)+45) + ")"; 
			})


			bars.b.select("rect")
				.attr("height",14)
				.attr("width", function(d,i){return bar_scale(d.share)})
				.attr("x", function(d,i){return 0})
				.attr("y", function(d,i){return 0})
				.attr("fill",function(d,i){return fuel_color(d.fuel)})
				;


			bars.b.select("text.fuel-share")
				.text(function(d,i){return d.fuel_type + ": " + format.fn(d.share, "sh1")})
				.style("font-size","11px")
				.attr("text-anchor","start")
				.attr("x",function(d,i){
					return 2; 
				})
				.attr("y","11")
		}

		var control_outer = d3.select("#energy-decoupling-control")
				.style("min-width", "250px")
				.style("margin","0px auto")
				.style("padding","1em 2em 1em 1em");

		var resize_timer;
		var firstlayout = true;
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
				plots.b.transition().duration(firstlayout ? 0 : 1300).delay(0).attr("transform", function(d,i){
					var xy = grid.layout(i);
					return "translate(" + xy.x + "," + xy.y + ")"
				}).on("start", function(d,i){
					var thiz = d3.select(this);
					var xy = grid.layout(i);
					thiz.selectAll("g.y-axis").style("visibility", xy.col==0 ? "visible" : "hidden");
					thiz.selectAll("g.line-plot g.x-axis").style("visibility", xy.row%3==0 ? "visible" : "hidden");
					thiz.selectAll("g.path-labels").style("visibility", xy.row==0 && xy.col==0 ? "visible" : "hidden");
					thiz.select("g.v-shift").transition().attr("transform","translate(0," + (xy.row%3 != 0 && sortkey in {co2:1, gdp:1, diff:1} ? "15)" : "0)"));
				})
				firstlayout = false;
			}, firstlayout ? 0 : 150);
		}

		//plot control

		//control_outer.append("div").style("margin-bottom","2em").append("img").style("width","306px").attr("src","./build/legend.png");

		var sortby = {};
		

		var control = control_outer.append("div").style("padding","1em 0em 1em 0em").style("border","1px solid #dddddd").classed("c-fix",true);

		var box1 = control.append("div").style("float","left").style("padding","0em 1em 0em 1em");
		
			box1.append("p").style("margin","0em 0em 0em 0em").append("strong").text("Sort the 50 states and D.C. by");

			box1.append("p").style("margin","1em 0em 0em 0em").style("font-size","0.9em").append("em").text("Decoupling trends, 2000–14");
			sortby.diff = box1.append("p").text("Percentage point difference between GDP and emissions growth").classed("sortby selected",true).datum("diff");
			sortby.gdp = box1.append("p").text("Percent change in real GDP").classed("sortby",true).datum("gdp");
			sortby.co2 = box1.append("p").text("Percent change in emissions").classed("sortby",true).datum("co2");
			
		var box2 = control.append("div").style("float","left").style("padding","0em 1em 0em 1em");

		box2.append("p").style("margin","1em 0em 0em 0em").style("font-size","0.9em").append("em").text("CO2 emissions per person (metric tons)");
		sortby.chg = box2.append("p").text("Absolute change, 2000–14").classed("sortby",true).datum("chg");
		sortby.pct_chg = box2.append("p").text("Percent change, 2000–14").classed("sortby",true).datum("pct_chg");
		sortby.pc2014 = box2.append("p").text("2014 levels").classed("sortby",true).datum("co2_pc_2014");

		var box3 = control.append("div").style("float","left").style("padding","0em 1em 0em 1em");

		box3.append("p").style("margin","1em 0em 0em 0em").style("font-size","0.9em").append("em")
				.text("Share of 2014 net electricity generation from");
		sortby.coal = box3.append("p").text("Coal").classed("sortby",true).datum("share_coal");
		sortby.gas = box3.append("p").text("Natural gas").classed("sortby",true).datum("share_natgas");
		sortby.nuclear = box3.append("p").text("Nuclear").classed("sortby",true).datum("share_nuclear");
		sortby.hydro = box3.append("p").text("Hydro").classed("sortby",true).datum("share_hydro");
		sortby.windsolar = box3.append("p").text("Wind and solar").classed("sortby",true).datum("share_windsolar");

		var sortbuttons = control.selectAll("p.sortby");

		function sort_and_draw(key){
			sortkey = key;
			data.sort(function(a,b){
				var aval = a.sort[0][key];
				var bval = b.sort[0][key];
				var comp =  aval >= bval ? -1 : 1; 
				if(key=="state" || key=="co2" || key=="co2_pc_2014" || key=="chg" || key=="pct_chg"){
					return comp*(-1);
				}
				else{
					return comp;
				}
			});

			draw_plots();
			lay_it_out();

			if(sortkey in {diff:1, co2:1, gdp:1}){
				//hide
				plots.bar.transition().duration(300).style("opacity",0).on("end", function(){plots.bar.style("display","none")})
				plots.pc.transition().duration(300).style("opacity",0).on("end", function(){plots.pc.style("display","none")})
				
				//show
				plots.line.transition().duration(300).style("opacity",1).on("start", function(){plots.line.style("display","inline")})
			}
			else if(sortkey in {co2_pc_2000:1, co2_pc_2014:1, chg:1, pct_chg:1}){
				//hide
				plots.bar.transition().duration(300).style("opacity",0).on("end", function(){plots.bar.style("display","none")})
				plots.line.transition().duration(300).style("opacity",0).on("end", function(){plots.line.style("display","none")})
				
				//show
				plots.pc.transition().duration(300).style("opacity",1).on("start", function(){plots.pc.style("display","inline")})
			}					
			else{
				//hide
				plots.pc.transition().duration(300).style("opacity",0).on("end", function(){plots.pc.style("display","none")})
				plots.line.transition().duration(300).style("opacity",0).on("end", function(){plots.line.style("display","none")})
				
				//show
				plots.bar.transition().duration(300).style("opacity",1).on("start", function(){plots.bar.style("display","inline")})
			
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