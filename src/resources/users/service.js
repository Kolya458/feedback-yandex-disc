const mongoose = require('mongoose');
const passport = require('passport');
const Users = mongoose.model('Users');
const jwt = require('jsonwebtoken');
const config = require('config');


const signUpRoute = config.get('routes.users.signUp');
const loginRoute = config.get('routes.users.login');
const rootRoute = config.get('routes.root');

const createUser = async (req, res, next, user) => {
    let isUserExists;
    await Users.findOne({email: user.email})
      .then(data => isUserExists = !!data)
      .catch(next);

    if(!isUserExists){
      const finalUser = new Users(user);
  
      finalUser.setPassword(user.password);
  
      return finalUser.save()
        .then(() => res.json({ user: finalUser.toAuthJSON() })).catch(next) ;
    } else {
      res.json({error: 'email already in use'})
    }
    

};

function loginUser(req, res, next) {
    return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
        if(err) {
          return next(err);
        }
    
        if(passportUser) {
          const user = passportUser;
          user.token = passportUser.generateJWT();
    
          return res.json({ user: user.toAuthJSON() });
        }
        
        return res.status(400).send(info);
      })(req, res, next);
}
  
const getUserProfile = (req, res, next) => {

    const {id} = req.user;
  
    return Users.findById(id)
      .then((user) => {
        if(!user) {
          return res.sendStatus(400);
        }
  
        return res.json({ user: user.getUser()})
      })
      .catch(next);
}

const changeUserpic = (req, res, next) => {
  const {id} = req.user;
  const newUserpicUrl = req.file.filename

  Users.findByIdAndUpdate({_id: id}, {userpicUrl: newUserpicUrl})
    .then(user => {
      res.json({user: user.getUser()});
    })
    .catch(next);
}

const authAction = (req, res, next) => {

    const {user} = req.body;
  
    if(!user.email || !user.password){
      return res.status(400)
    }

    switch(req.url) {
        case signUpRoute: createUser(req, res, next, user);
            break;
    
        case loginRoute: loginUser(req, res, next);
            break;
    }
}

const logout = (req, res) => {
  req.logout();
  res.redirect(rootRoute);
}
  
module.exports = {
    getUserProfile,
    authAction,
    logout,
    changeUserpic
}