#to do: double check data sheets -- do a data valiation against most recent available

#import and process energy decoupling data
library(tidyr)
library(dplyr)
library(jsonlite)
library(ggplot2)

#states
states <- read.table("http://www2.census.gov/geo/docs/reference/state.txt", sep="|", header=TRUE, stringsAsFactors=FALSE, colClasses="character")[1:3]
names(states) <- c("stfips", "stabbr", "state")

#fuel type
ft <- read.csv("/home/alec/Projects/Brookings/energy-decoupling/data/electricity_generation_fueltype_shares_and_growth.csv", stringsAsFactors=FALSE, na.strings=c("N/A",".",""))
ft <- merge(states, ft, by="state")

ftt <- ft %>% gather(var, val, share_coal:chg_windsolar) %>%
  separate(var, into=c("metric", "fuel"), sep="_") %>%
  spread(metric, val)
ftt$fuel_type <- factor(ftt$fuel, levels=c("coal", "natgas", "nuclear", "hydro", "windsolar", "other"),
                        labels=c("Coal", "Natural gas", "Nuclear", "Hydroelectric", "Wind and solar", "Other"))

#computer other residual
residual <- function(g){
  new_row <- g[1, ]
  new_row$fuel <- "other"
  new_row$fuel_type <- "Other"
  new_row$chg <- NA
    other_share <- 1-sum(g$share)
    if(other_share < 0){other_share <- 0}
  new_row$share <- other_share
  
  return(rbind(g, new_row))
}
ftf <- ftt %>% group_by(stabbr) %>% do(residual(.))

table(ftf$fuel,ftf$fuel_type)

#emissions and gdp
eg <- read.csv("/home/alec/Projects/Brookings/energy-decoupling/data/emissions_and_gdp.csv", stringsAsFactors=FALSE)
eg$State <- sub("^\\s*", "", eg$State)
eg$State <- sub("District Of Columbia", "District of Columbia", eg$State)

eg <- merge(states, eg, by.x="state", by.y="State")

#double check findings in paper re # of states that have decoupoled (emissions decline, GDP growth > emissions)
nrow(filter(eg, CO2_2013 < CO2_2000 & GDP_2013 > GDP_2000))
nrow(filter(eg, CO2_2014 < CO2_2000 & GDP_2014 > GDP_2000))

unique(eg$STATE_NAME)

tidy <- eg %>% gather(var, val, CO2_2000:CO2_2014, GDP_2000:GDP_2014) %>%
                separate(var, into=c("var", "year"), sep="_") %>%
                spread(var, val)
tidy$year <- as.numeric(tidy$year)

fn <- function(e){
  CO2_00 <- e[e$year==2000, "CO2", drop=TRUE]
  GDP_00 <- e[e$year==2000, "GDP", drop=TRUE]
  
  if(length(CO2_00)!=1 || length(GDP_00)!=1){
    warning("Unique base year value(s) not found.")
  }
  
  e$CO2i <- (e$CO2/CO2_00)*100
  e$GDPi <- (e$GDP/GDP_00)*100
 
  return(e)
}

fn2 <- function(e){
  return(fn(as.data.frame(e)))
}

#final emissions and gdp list
st <- split(tidy[c("state", "stfips", "stabbr", "year", "CO2", "GDP")], tidy$stabbr)
l <- lapply(st, fn)

#final fuel type list -- not the result is ordered
l2 <- lapply(split(ftf, ftf$stabbr), function(e){
  ee <- e[order(e$fuel_type), ]
  cat("Sum of data frame shares in ")
  cat(ee$state[1])
  cat(": ")
  cat(sum(ee$share))
  cat("\n")
  return(ee)
})

#sort parameters
sp1 <- eg[,1:5]
names(sp1)[4:5] <- c("gdp", "co2")
sp1$diff <- sp1$gdp - sp1$co2
sp2 <- ft[,c("state","share_coal","share_natgas","share_nuclear","share_hydro","share_windsolar")]
sp3 <- merge(sp1, sp2, by="state")
sp <- split(sp3, sp3$stabbr)

j <- toJSON(list(trends=l, fuel=l2, sort=sp))

writeLines(j, "/home/alec/Projects/Brookings/energy-decoupling/data/energy_decoupling.json")


#analysis - review this code and non-standard vs standard evaluation
max(sapply(l, function(e){return(max(c(e$CO2i, e$GDPi)))}))
min(sapply(l, function(e){return(min(c(e$CO2i, e$GDPi)))}))

gg_data <- tidy %>% group_by(state, stabbr) %>% do(fn2(.))

gg <- ggplot(gg_data, aes(x=year))
gg + geom_line(aes(y=GDPi), color = "#008837") + geom_line(aes(y=CO2i, color=ifelse(CO2i<100, 1, 0))) +
    facet_wrap(~state)


gg2 <- ggplot(ftf, aes(x=fuel_type)) + geom_bar(aes(y=share, fill=fuel_type), stat="identity")
gg2 + facet_wrap(~state)


#EXAMPLES
# geom_line() is suitable for time series
ggplot(economics, aes(date, unemploy)) + geom_line()
ggplot(economics_long, aes(date, value01, colour = variable)) +
  geom_line()

#non-standard eval
#parent.frame is the frame the function was called from
ff <- function(){
  print(parent.frame())
  fff <- function(){
    print(parent.frame())
  }
  fff()
}
ff()

#modified example from from H. Wickham's Advanced R (http://adv-r.had.co.nz/Computing-on-the-language.html)
sample_df <- data.frame(a = 1:5, b = 5:1, c = c(5, 3, 1, 4, 1))

#calling from a function
subset2 <- function(x, condition) {
  condition_call <- substitute(condition)
  print(condition_call)
  r <- eval(condition_call, x, parent.frame())
  x[r, ]
}

scramble <- function(x) x[sample(nrow(x)), ]

subscramble <- function(x, condition) {
  scramble(subset2(x, condition))
}

subscramble(sample_df, a >= 4)
subset2(sample_df, a>=4)

#A useful note from Wickham: 
#substitute() is itself a function that uses non-standard evaluation and doesn’t have an escape hatch. 
#This means we can’t use substitute() if we already have an expression saved in a variable:
#

#Also:
#substitute() works because function arguments are represented by a special type of object called a promise. 
#A promise captures the expression needed to compute the value and the environment in which to compute it. 
#You’re not normally aware of promises because the first time you access a promise its code is evaluated in 
#its environment, yielding a value.

#nice quick explanation from Stack Overflow that augments Wickham's

#When subset2() is called from within subscramble(), condition_call's value is the symbol condition 
#(rather than the call a >= 4 that results when it is called directly). subset()'s call to eval() 
#searches for condition first in envir=x (the data.frame sample_df). Not finding it there, it next 
#searches in enclos=parent.frame() where it does find an object named condition.

#That object is a promise object, whose expression slot is a >= 4 and whose evaluation environment is 
#.GlobalEnv. Unless an object named a is found in .GlobalEnv or further up the search path, evaluation 
#of the promise then fails with the observed message that: Error in eval(expr, envir, enclos) : object 'a' not found.
