// const express = require('express')
// const cors   = require('cors')
// const { default: mongoose } = require('mongoose')
// const app = express()
// const User = require('./models/User')
// const bcrypt = require('bcrypt')
// const jwt = require('jsonwebtoken')
// const cookieParser = require('cookie-parser')
// const multer = require('multer') 
// const fs = require('fs')
// const Post = require('./models/post')

// const secret = 'ghsdajyfoikcnwerszxbvnmtyupozbo'
// const salt = bcrypt.genSaltSync(10)
// const uploadMiddleware = multer({ dest: 'uploads/' })

// app.use(cors({credentials:true,origin:"https://gothbaat.vercel.app" ||'http://localhost:3000'}))
// app.use(express.json())
// app.use(cookieParser())
// app.use('/uploads', express.static(__dirname + '/uploads'));
// mongoose.connect('mongodb+srv://dhamendrasahu18:dhamendrsahu18@cluster0.7fq62od.mongodb.net/?retryWrites=true&w=majority').then(() => {
//     console.log('mongo db connected successfully to your node project')
// })

const express = require('express');
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const app = express();
const User = require('./models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
const Post = require('./models/post');

const secret = 'ghsdajyfoikcnwerszxbvnmtyupozbo';
const salt = bcrypt.genSaltSync(10);
const uploadMiddleware = multer({ dest: 'uploads/' });

const corsOptions = {
  credentials: true,
  origin: ['https://gothbaat.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['set-cookie'],
  sameSite: 'none',
  preflightContinue: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));
mongoose
  .connect('mongodb+srv://dhamendrasahu18:dhamendrsahu18@cluster0.7fq62od.mongodb.net/?retryWrites=true&w=majority')
  .then(() => {
    console.log('mongo db connected successfully to your node project');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });




app.post('/register',async (req,res)=>{
   const {username,password} = req.body
   try{
   const userDoc = await User.create({
    username,
    password:bcrypt.hashSync(password,salt)
    })
   res.json(userDoc)
   }catch(e){
    console.log(e)
    res.status(400).json(e)
   }
})

// app.post('/login',async(req,res)=>{
//     const {username,password}=req.body
//     const userDoc = await User.findOne({username})
//     const passOk =  bcrypt.compareSync(password, userDoc.password);
//     // res.json(passOk)
//     if (passOk){
//     //    logged in
//     jwt.sign({username,id:userDoc._id},secret,{},(err,token)=>{
//      if (err) throw err;
//      res.cookie('token',token).json({
//         id : userDoc._id,
//         username,
//      })
//     })

//     }else{
//         res.status(400).json('wrong credentials')
//     }
// })
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const userDoc = await User.findOne({ username });

    if (!userDoc) {
      // User not found
      return res.status(400).json('User not found');
    }

    const passOk = bcrypt.compareSync(password, userDoc.password);

    if (passOk) {
      // Logged in
      jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token).json({
          id: userDoc._id,
          username,
        });
      });
    } else {
      // Incorrect password
      res.status(400).json('Wrong credentials');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// app.get('/profile',(req,res)=>{
//     const {token} = req.cookies
//     jwt.verify(token, secret,{},(err,info)=>{
//      if (err)throw err
//      res.json(info)
//     })
// })

app.get('/profile',(req,res)=>{
  const {token} = req.cookies;
  console.log('Received token:', token); // Add this log
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) {
      console.error('JWT verification error:', err); // Add this log
      res.status(401).json({ error: 'Unauthorized user' });
    } else {
      console.log('Decoded token:', info); // Add this log
      res.json(info);
    }
  });
});


app.post('/logout',(req,res)=>{
    res.cookie('token','').json('ok')
})

// handels post request of create post
// app.post('/post',uploadMiddleware.single('file'),async(req,res)=>{
//     const {originalname,path} = req.file
//     const parts = originalname.split('.');
//     const ext = parts[parts.length - 1];
//     const newPath = path+'.'+ext;
//     fs.renameSync(path,newPath)
  
//     const {token} = req.cookies
//     jwt.verify(token, secret,{},async(err,info)=>{
//         if (err)throw err
//         const {title,summary,content} = req.body
//         const postDoc =    await Post.create({
//          title,
//          summary,
//          content,
//          cover : newPath,
//          author : info.id,
//         })
//         res.json(postDoc)
//        })
// })
app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);

    const { token } = req.cookies;
   // Add this log to check the received token
console.log('Received token:', token);


    // Verify the JWT token
    jwt.verify(token, secret, async (err, info) => {
      if (err) {
        return res.status(401).json({ error: 'Unauthorized user' });
      }

      // Extract user ID from the decoded token
      const authorId = info.id;

      const { title, summary, content } = req.body;
      
      // Create a new post with the given data
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: newPath,
        author: authorId,
      });

      res.json(postDoc);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/post', async (req,res) => {
    res.json(
      await Post.find() .populate('author', ['username'])
    )
  });

  app.get('/post/:id', async (req, res) => {
    const {id} = req.params;
    const postDoc = await Post.findById(id).populate('author', ['username']);
    res.json(postDoc);
  })

  app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
    let newPath = null;
    if (req.file) {
      const { originalname, path } = req.file;
      const parts = originalname.split('.');
      const ext = parts[parts.length - 1];
      newPath = path + '.' + ext;
      fs.renameSync(path, newPath);
    }
  
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) throw err;
      const { id, title, summary, content } = req.body;
      const postDoc = await Post.findById(id);
      const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
  
      if (!isAuthor) {
        res.status(400).json("you are not an author of this post");
      } else {
        await postDoc.updateOne({
          title,
          summary,
          content,
          cover: newPath ? newPath : postDoc.cover
        });
  
        res.json(postDoc);
      }
    });
  });
  
app.listen(4000,()=>{
    console.log('port running')
})
