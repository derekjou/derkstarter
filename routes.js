"use strict";

// Routes, with inline controllers for each route.
var express = require('express');
var router = express.Router();
var Project = require('./models').Project;
var strftime = require('strftime');
var _ = require('underscore');

// Example endpoint
router.get('/create-test-project', function (req, res) {
  var project = new Project({
    title: 'I am a test project'
  });
  project.save(function (err) {
    if (err) {
      res.status(500).json(err);
    } else {
      res.send('Success: created a Project object in MongoDb');
    }
  });
});

// Part 1: View all projects
// Implement the GET / endpoint.
router.get('/', function (req, res) {
  // YOUR CODE HERE
  if (req.query.sort === 'start' || req.query.sort === 'end' || req.query.sort === 'goal') {
    var sortObject = {};
    sortObject[req.query.sort] = req.query.sortDirection;
    console.log(sortObject);
    Project.find().sort(sortObject).exec(function (err, project) {
      res.render('index', {
        projects: project,
        orderType: req.query.sort
      })
    })
  }
  else if (req.query.sort === 'contributions') {
    Project.find(function (err, projects) {
      let sortedProj = _.sortBy(projects, function (project) {
        let totalCont = 0;
        for (let i = 0; i < project.contributions.length; i++) {
          totalCont += project.contributions[i].amount;
        }
        return totalCont;
      })
      if(req.query.sortDirection === "descending"){
        sortedProj = sortedProj.reverse();
      }
      res.render('index', {
        projects: sortedProj,
        orderType: req.query.sort
      })
    })
  }
  else if(req.query.sort === 'fullyFunded'){
    Project.find(function (err, projects) {
      let filterProj = _.filter(projects, function (project) {
        let totalCont = 0;
        for (let i = 0; i < project.contributions.length; i++) {
          totalCont += project.contributions[i].amount;
        }
        return totalCont>project.goal;
      })
      filterProj = _.sortBy(filterProj, function (project) {
        let totalCont = 0;
        for (let i = 0; i < project.contributions.length; i++) {
          totalCont += project.contributions[i].amount;
        }
        return totalCont;
      })
      if(req.query.sortDirection === "descending"){
        filterProj = filterProj.reverse();
      }
      res.render('index', {
        projects: filterProj,
        orderType: req.query.sort
      })
    })
  }
  else if(req.query.sort === 'notFullyFunded'){
    Project.find(function (err, projects) {
      let filterProj = _.filter(projects, function (project) {
        let totalCont = 0;
        for (let i = 0; i < project.contributions.length; i++) {
          totalCont += project.contributions[i].amount;
        }
        return totalCont<project.goal;
      })
      filterProj = _.sortBy(filterProj, function (project) {
        let totalCont = 0;
        for (let i = 0; i < project.contributions.length; i++) {
          totalCont += project.contributions[i].amount;
        }
        return totalCont;
      })
      if(req.query.sortDirection === "descending"){
        filterProj = filterProj.reverse();
      }
      res.render('index', {
        projects: filterProj,
        orderType: req.query.sort
      })
    })
  }
  else {
    Project.find(function (err, project) {
      if (err) {
        console.log('Found no such project');
      }
      else {
        res.render('index', { projects: project })
      }
    })
  }
});

// Part 2: Create project
// Implement the GET /new endpoint
router.get('/new', function (req, res) {
  // YOUR CODE HERE
  res.render('new', {
    first: true
  })
});

// Part 2: Create project
// Implement the POST /new endpoint
router.post('/new', function (req, res) {
  // YOUR CODE HERE
  if (!areValidInputs(req.body)) {
    let notNum = isNaN(req.body.goal)
    res.render('new', {
      first: false,
      title: req.body.title,
      goal: req.body.goal,
      description: req.body.description,
      start: req.body.start,
      end: req.body.end,
      notNum: notNum,
      category: req.body.category
    })
  }
  else {
    let newProj = new Project({
      title: req.body.title,
      goal: req.body.goal,
      description: req.body.description,
      start: req.body.start,
      end: req.body.end,
      category: req.body.category
    })
    newProj.save(function (err, data) {
      if (err) {
        console.log('Could not save', err);
      }
      else {
        console.log('Successfully saved!', data)
        Project.find(function (err, project) {
          if (err) {
            console.log('Found no such project');
          }
          else {
            res.redirect('/');
          }
        })
      }
    })
  }
});

function areValidInputs(bodyInputs) {
  return Boolean(bodyInputs.title.trim()) && Boolean(bodyInputs.goal) && Boolean(bodyInputs.description) && bodyInputs.start !== null && bodyInputs.end !== null
}

// Part 3: View single project
// Implement the GET /project/:projectid endpoint
router.get('/project/:projectid', function (req, res) {
  // YOUR CODE HERE
  Project.findById(req.params.projectid, function (err, project) {
    let totalContributions = 0;
    console.log(project.category);
    for (let i = 0; i < project.contributions.length; i++) {
      totalContributions += Number(project.contributions[i].amount);
    }
    let percentComplete = Math.floor(totalContributions / project.goal * 100);
    res.render('project', {
      title: project.title,
      goal: project.goal,
      description: project.description,
      start: project.start,
      end: project.end,
      contributionsArr: project.contributions,
      totalContributions: totalContributions,
      id: req.params.projectid,
      percent: percentComplete,
      category: project.category
    })
  })
});

// Part 4: Contribute to a project
// Implement the GET /project/:projectid endpoint
router.post('/project/:projectid', function (req, res) {
  // YOUR CODE HERE
  Project.findById(req.params.projectid, function (err, project) {
    project.contributions.push({ name: req.body.name, amount: req.body.amount });
    project.save();
    res.redirect('/project/' + req.params.projectid);
  })
});

// Part 6: Edit project
// Create the GET /project/:projectid/edit endpoint
function getDate(date) {
  if (date) {
    return date.toISOString().substring(0, 10);
  }
  else {
    return null;
  }
}


router.get('/project/:projectid/edit', function (req, res) {

  Project.findById(req.params.projectid, function (err, project) {
    res.render('editProject', {
      title: project.title,
      goal: project.goal,
      description: project.description,
      start: getDate(project.start),
      end: getDate(project.end),
      category: project.category,
      id: req.params.projectid
    })
  })
})

// Create the POST /project/:projectid/edit endpoint
router.post('/project/:projectid/edit', function (req, res) {
  Project.findByIdAndUpdate(req.params.projectid, {
    title: req.body.title,
    goal: req.body.goal,
    description: req.body.description,
    start: req.body.start,
    end: req.body.end,
    category: req.body.category,
    id: req.params.projectid
  }, function (err) {
    console.log('could not update');
  })
  res.redirect('/');
})

module.exports = router;
