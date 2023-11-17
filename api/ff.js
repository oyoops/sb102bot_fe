const _ = require('lodash');
const { Client } = require('espn-fantasy-football-api/node');

const myClient = new Client({
  leagueId: 473315//, // Replace with your league ID
  //espnS2: process.env.ESPN_S2, // Set your espnS2 in environment variables
  //SWID: process.env.SWID // Set your SWID in environment variables
});

// Include the Psychic class definition here...

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { teamId, weekNumber } = req.body;
    const seasonId = new Date().getFullYear(); // or set a specific year
    const matchupPeriodId = weekNumber;
    const scoringPeriodId = weekNumber;

    const boxscores = await myClient.getBoxscoreForWeek({ seasonId, matchupPeriodId, scoringPeriodId });
    const teamBoxscore = boxscores.find(box => box.homeTeamId === teamId || box.awayTeamId === teamId);

    if (!teamBoxscore) {
      throw new Error('Team not found in the specified week');
    }

    const lineup = teamBoxscore.homeTeamId === teamId ? teamBoxscore.homeRoster : teamBoxscore.awayRoster;
    const score = teamBoxscore.homeTeamId === teamId ? teamBoxscore.homeScore : teamBoxscore.awayScore;

    const optimizedLineup = Psychic.analyzeLineup(lineup, score);
    res.status(200).json(optimizedLineup);
  } catch (error) {
    console.error('Error optimizing lineup:', error);
    res.status(500).send(error.toString());
  }
};
