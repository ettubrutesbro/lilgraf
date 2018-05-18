import React, { Component } from 'react';
import moment from 'moment'
import './App.css'; //i dont know how to use styled-components yet (used to postCSS / modules) so i did vanilla css, sorry

const data = require('./dataset.json').reverse()
const statsToUse = [
  //static ranges allow user-to-user comparisons to hold more value
  //you could make it dynamic to accommodate for crazy outlier values or new best averages
  {title: 'Score', datalabel: 'score', trendName: 'Scoring', rangeTop: 20000, rangeBottom: 0, divideTick: 1000},
  {title: 'Kills per game', datalabel: 'kills', trendName: 'Kills', rangeTop: 20, rangeBottom: 0},
  {title: 'Wins', datalabel: 'placetop1', trendName: 'Wins', rangeTop: 20, rangeBottom: 0},
  {title: 'Top 5\'s', datalabel: 'placetop5', trendName: 'Top 5 Finishes', rangeTop: 20, rangeBottom: 0},
  //TODO: using top 12 here and not 10/25 because those are null values only in the provided data
  {title: 'Top 12\'s', datalabel: 'placetop12', trendName: 'Top 12 Finishes', rangeTop: 20, rangeBottom: 0},
  // {title: 'Top 10\'s', datalabel: 'placetop10', rangeTop: 15, rangeBottom: 0},
  // {title: 'Top 25\'s', datalabel: 'placetop25', rangeTop: 15, rangeBottom: 0},
  {title: 'Time Played', datalabel: 'minutesPlayed', trendName: 'Playtime', rangeTop: 600, rangeBottom: 0},
  {title: 'Games Played', datalabel: 'matchesPlayed', trendName: 'Games Played', rangeTop: 50, rangeBottom: 0}
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
  selectStat = (idx) => this.setState({selectedStat: idx})
  mouseHoveredDay = (idx) => this.setState({hoveredDay: idx})
  mouseUnhoveredDay = (idx) => this.setState({hoveredDay: null})

  render() {
    const {selectedStat, hoveredDay} = this.state
    const {rangeTop, rangeBottom, divideTick} = statsToUse[selectedStat]
    const stat = statsToUse[selectedStat].datalabel

    const shownData = data.map((d, i, arr)=>{
      //converts data into per-day, divides if necessary
      let divisor = 1
      //if kills, the divisor is games played in the same day...
      if(stat === 'kills') divisor = i>0? d.stats.matches_played - arr[i-1].stats.matches_played : 1
      return i>0? (d.stats[stat] - arr[i-1].stats[stat]) / divisor : 0
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
      if(stat === 'minutesPlayed'){
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
            Trends <span className = 'deemphasized'> in </span> {this.props.userName}'s {statsToUse[selectedStat].trendName} 
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
                //starting position is not 0
                const it = ((data.length)-this.props.xTicks) + i
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
                        transform: `scaleY(${((shownData[it]-rangeBottom) / (rangeTop - rangeBottom))})`,
                      }}
                    />
                    {hoveredDay === i &&
                    <div 
                        className = {['tooltip', i>(this.props.xTicks*.66)?'leftSide':''].join(' ')}
                        style = {{bottom: `${((shownData[it]-rangeBottom) / (rangeTop - rangeBottom))*100}%`}}
                    >
                      <div className = 'date'>{moment(data[it].date).format('MMM D')}</div>
                      <div className = 'value'>
                      {stat ==='minutesPlayed' && 
                        <React.Fragment>
                              {`${Math.floor(shownData[it]/60)}h ${shownData[it] % 60}m`}
                        </React.Fragment>
                      } 
                      {stat !== 'minutesPlayed' && 
                        parseFloat(shownData[it].toFixed(2)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      <span className = 'unit'>
                        {stat === 'placetop1' && 'Wins'} 
                        {(stat === 'placetop5' || stat === 'placetop10' || stat === 'placetop12' || stat === 'placetop25') && 'Games'}
                        {stat === 'kills' && 'Kills / game'}
                        {stat === 'score' && 'Points'}
                        {stat === 'matchesPlayed' && 'Games'}
                      </span>
                      </div>
                    </div>
                    }
                  </div>
                  
                )
                })}
                </div>
              <div className = 'dates'>
                {data.slice((data.length)-this.props.xTicks).map((day, i)=>{
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
  xTicks: 15, //odd numbers allow for alternating or midpoint,
  userName: 'UserName' 
}

export default TrendGraph;
