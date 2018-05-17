import React, { Component } from 'react';
import moment from 'moment'
import './App.css';

const data = require('./dataset.json')
const statsToUse = [
  //static ranges allow user-to-user comparisons to hold more value
  //you could make it dynamic to accommodate for crazy outlier values, but the value added
  // of a trend graph is probably to track trends, not outliers and world records, right? 
  {title: 'Kills / game', datalabel: 'kills', rangeTop: 15, rangeBottom: 0},
  {title: 'Score', datalabel: 'score', rangeTop: 15000, rangeBottom: 0},
  {title: 'Wins', datalabel: 'placetop1', rangeTop: 12, rangeBottom: 0},
  {title: 'Top 5\'s', datalabel: 'placetop5', rangeTop: 15, rangeBottom: 0},
  {title: 'Top 10\'s', datalabel: 'placetop10', rangeTop: 15, rangeBottom: 0},
  {title: 'Top 25\'s', datalabel: 'placetop25', rangeTop: 15, rangeBottom: 0},
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
    const {rangeTop, rangeBottom} = statsToUse[selectedStat]

    const shownData = data.map((d, i, arr)=>{
      //converts data into per-day, divides if necessary
      const label = statsToUse[selectedStat].datalabel
      let divisor = 1
      //if kills, divide by game...
      if(label === 'kills') divisor = i<arr.length-1? d.stats.matches_played - arr[i+1].stats.matches_played : 1
      return i<arr.length-1? (d.stats[label] - arr[i+1].stats[label]) / divisor : 0
    })
    console.log(shownData)

    let statRange = []
    const rangediff = (rangeTop - rangeBottom) / (this.props.yTicks-1)
    for(var i = 0; i<this.props.yTicks; i++){
      let tick = rangeTop - (i*rangediff)
      if(tick % 1!==0) tick = tick.toFixed(1)
      statRange.push(tick)
    }

    return (
      <div className="trendGraph">
        <div className = 'statColumn'>
          {statsToUse.map((stat,i)=>{
            return(
              <div 
                  key = {stat.title}
                  className = {['stat', selectedStat === i? 'selected' : ''].join(' ')}
                  // className = {
                  //   ["stat", this.state.selectedStat===i?'selected' : ''].join(' ')}
                  onClick = {()=>{this.selectStat(i)}}
                > 
                  {stat.title} 
              </div>
            )
          })}
        </div>
        <div className = 'graphBody'>
          <div className =  'x'>
            <div className = 'statRange'> 
              {/*4 ticks dividing top and bottom of range (6 total)*/
                statRange.map((tick)=>{
                  return(
                    <div 
                      key = {'tick'+tick}
                    className = "tick"> {tick} </div>
                  )
                })
              }
              
              
            </div>
            <div className = 'actualGraph'>
              <div className = 'actualActualGraph'>
              {React.Children.map(Array(this.props.xTicks), (e,i)=> {
                return <div 
                  className = 'graphSeg'
                  style = {{
                    width: 100/this.props.xTicks + '%',
                    //!important: this fill is the NEGATIVE
                    height: (100 - ((shownData[i]-rangeBottom) / (rangeTop - rangeBottom) * 100)) + '%',
                    // height: ((shownData[i]-rangeBottom) / (rangeTop - rangeBottom) * 100) + '%',
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

      </div>
    );
  }
}

TrendGraph.defaultProps = {
  yTicks: 6,
  xTicks: 15, //odd numbers allow for alternating or midpoint 
}

export default TrendGraph;
