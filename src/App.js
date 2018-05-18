import React, { Component } from 'react';
import moment from 'moment'
import './App.css'; //i dont know how to use styled-components yet (used to postCSS / modules) so i did vanilla css, sorry

const data = require('./dataset.json')
const statsToUse = [
  //static ranges allow user-to-user comparisons to hold more value
  //you could make it dynamic to accommodate for crazy outlier values, but the value added
  // of a trend graph is probably to track trends, not outliers and world records, right? 
  {title: 'Score', datalabel: 'score', rangeTop: 20000, rangeBottom: 0, divideTick: 1000},
  {title: 'Kills / game', datalabel: 'kills', rangeTop: 20, rangeBottom: 0},
  {title: 'Wins', datalabel: 'placetop1', rangeTop: 20, rangeBottom: 0},
  {title: 'Top 5\'s', datalabel: 'placetop5', rangeTop: 20, rangeBottom: 0},
  //TODO: using top 12 here and not 10/25 because those are null values only in the provided data
  {title: 'Top 12\'s', datalabel: 'placetop12', rangeTop: 20, rangeBottom: 0},
  // {title: 'Top 10\'s', datalabel: 'placetop10', rangeTop: 15, rangeBottom: 0},
  // {title: 'Top 25\'s', datalabel: 'placetop25', rangeTop: 15, rangeBottom: 0},
  {title: 'Time Played', datalabel: 'minutesPlayed', rangeTop: 600, rangeBottom: 0}
]

class TrendGraph extends Component {

  constructor(props){
    super(props)
    this.state = {
      hoveredDay: null,
      selectedStat: 0,
    }
  }
  //using react state this way causes a ton of rerenders, hope it doesnt blow up perf, sorry
      // could ameliorate that with additional react lifecycle stuff but we should see if that's necessary first
      //im used to managing state differently (mobx) so didnt want to sink time into it here
  selectStat = (idx) => this.setState({selectedStat: idx})
  mouseHoveredDay = (idx) => this.setState({hoveredDay: idx})
  mouseUnhoveredDay = (idx) => this.setState({hoveredDay: null})

  render() {
    const {selectedStat, hoveredDay} = this.state
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
      if(statsToUse[selectedStat].datalabel === 'minutesPlayed'){
        const hrs = Math.floor(tick / 60)
        const min = tick % 60
        if(min > 0) yTicks.push(hrs+'h '+min+'m')
        else yTicks.push(hrs+'h')
      }
      else yTicks.push(tick + suffix)
    }

    return (
      <div className="trends">
        <div className = 'header'>
          <h3>
            SypherPK's Solo: Score Trends
          </h3>
          <select className = 'modeSelector'
            onChange = {()=>{alert('TODO!')}}
            //TODO: insert logic here and options / conditionals below
          >
            <option selected = {this.props.mode === 'duo'}> Duo </option>
            <option selected = {this.props.mode === 'othermode'}> Other mode </option>
            <option selected = {this.props.mode === 'etc'}> Etc </option>
          </select>
        </div>
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
                return (
                  <div
                    style = {{width: 100/this.props.xTicks + '%'}} 
                    className = 'day'
                    onMouseEnter = {()=> this.mouseHoveredDay(i)}
                    onMouseLeave = {()=> this.mouseUnhoveredDay(i)}
                  >

                    <div 
                      className = 'bar'
                      style = {{
                        height: '100%',
                        transform: `scaleY(${((shownData[i]-rangeBottom) / (rangeTop - rangeBottom))})`,
                      }}
                    />
                    {hoveredDay === i &&
                    <div 
                        className = {['tooltip', i>(this.props.xTicks*.66)?'leftSide':''].join(' ')}
                        style = {{bottom: `${((shownData[i]-rangeBottom) / (rangeTop - rangeBottom))*100}%`}}
                    >
                      <div className = 'date'>{moment(data[i].date).format('MMM Do')}</div>
                      <div className = 'value'>
                      {statsToUse[selectedStat].datalabel ==='minutesPlayed' && 
                        <React.Fragment>
                              {`${Math.floor(shownData[i]/60)}h ${shownData[i] % 60}m`}
                        </React.Fragment>
                      } 
                      {statsToUse[selectedStat].datalabel !== 'minutesPlayed' && 
                        parseFloat(shownData[i].toFixed(2)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      } 
                      </div>
                    </div>
                    }
                  </div>
                  
                )
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
