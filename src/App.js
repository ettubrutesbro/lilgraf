import React, { Component } from 'react';
import moment from 'moment'
import './App.css'; //i recommend CSS modules; this vanilla version could create conflicts

const data = require('./dataset.json')
const statsToUse = [
  //static ranges allow user-to-user comparisons to hold more value
  //you could make it dynamic to accommodate for crazy outlier values, but the value added
  // of a trend graph is probably to track trends, not outliers and world records, right? 
  
  {title: 'Score', datalabel: 'score', rangeTop: 20000, rangeBottom: 0, divideTick: 1000},
  {title: 'Kills / game', datalabel: 'kills', rangeTop: 18, rangeBottom: 0},
  {title: 'Wins', datalabel: 'placetop1', rangeTop: 12, rangeBottom: 0},
  {title: 'Top 5\'s', datalabel: 'placetop5', rangeTop: 15, rangeBottom: 0},
  //TODO: using top 12 here and not 10/25 because those are null values only in the provided data
  {title: 'Top 12\'s', datalabel: 'placetop12', rangeTop: 25, rangeBottom: 0},
  // {title: 'Top 10\'s', datalabel: 'placetop10', rangeTop: 15, rangeBottom: 0},
  // {title: 'Top 25\'s', datalabel: 'placetop25', rangeTop: 15, rangeBottom: 0},
  {title: 'Time Played', datalabel: 'minutesPlayed', rangeTop: 720, rangeBottom: 0}
]

class TrendGraph extends Component {

  constructor(props){
    super(props)
    this.state = {
      selectedStat: 0
    }
  }

  selectStat = (idx) => {
    this.setState({
      selectedStat: idx
    })
  }

  render() {
    const {selectedStat} = this.state
    const {rangeTop, rangeBottom, divideTick} = statsToUse[selectedStat]

    const shownData = data.map((d, i, arr)=>{
      //converts data into per-day, divides if necessary
      const label = statsToUse[selectedStat].datalabel
      let divisor = 1
      //if kills, the divisor is games played in the same day...
      if(label === 'kills') divisor = i<arr.length-1? d.stats.matches_played - arr[i+1].stats.matches_played : 1
      return i<arr.length-1? (d.stats[label] - arr[i+1].stats[label]) / divisor : 0
    })
    console.log(shownData)

    let yTicks = []
    const rangediff = (rangeTop - rangeBottom) / (this.props.yTicks-1)
    for(var i = 0; i<this.props.yTicks; i++){
      let tick = rangeTop - (i*rangediff)
      let suffix = ''
      if(divideTick){
        tick = tick/divideTick
        if(divideTick===1000) suffix = 'k'
        else if(divideTick===1000000) suffix = 'm' 
      }
      if(tick % 1!==0) tick = parseFloat(tick.toFixed(2))
      if(tick===0) suffix = ''
      yTicks.push(tick + suffix)
    }

    return (
      <div className="trends">
        <div className = 'picker'>
          {statsToUse.map((stat,i)=>{
            return(
              <div 
                  key = {stat.title}
                  className = {['stat', selectedStat === i? 'selected' : ''].join(' ')}
                  onClick = {()=>{this.selectStat(i)}}
                > 
                  {stat.title} 
              </div>
            )
          })}
        </div>
        <div className = 'graph'>
            <div className = 'yTicks'> 
              {
                yTicks.map((tick)=>{
                  return(
                    <div 
                      key = {'tick'+tick}
                    className = "tick"> {tick} </div>
                  )
                })
              }
            </div>
            <div className = 'barsDates'>
              <div className = 'bars'>
              {React.Children.map(Array(this.props.xTicks), (e,i)=> {
                return <div 
                  className = 'bar'
                  style = {{
                    width: 100/this.props.xTicks + '%',
                    // height: (100 - ((shownData[i]-rangeBottom) / (rangeTop - rangeBottom) * 100)) + '%',
                    //animation based height?
                    height: '100%',
                    transform: `scaleY(${((shownData[i]-rangeBottom) / (rangeTop - rangeBottom))})`,
                    backgroundColor: 'blue'
                  }}
                />
              })}
              </div>
              <div className = 'dates'>
                {data.slice(0, this.props.xTicks).map((day, i)=>{
                  return(
                    <div
                      style = {{
                        width: (100 / this.props.xTicks) + '%',
                        visibility: i%2? 'hidden' : 'visible'
                      }}
                     className = 'day'> {moment(day.date).format('M/D')} </div>
                  )
                })}
              </div>
            </div>
            
        </div>

      </div>
    );
  }
}

TrendGraph.defaultProps = {
  yTicks: 6,
  xTicks: 15, //odd numbers allow for alternating or midpoint 
}

export default TrendGraph;
