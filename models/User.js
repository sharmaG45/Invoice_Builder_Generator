const mongoose = require('mongoose');
const {hash,compare,genSalt}=require('bcrypt')

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        phone: {
            type: Number,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            required: true  // Assuming role is required
        },
        // image:{
        //     type:String,
        //     required:true
        // }
    },
    {
        timesstamp:true
    }
);


UserSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next()
    }

    const salt=await genSalt(10)
    this.password=await hash(this.password,salt)
})


UserSchema.methods.comparePassword=async function(password){
    return await compare(password,this.password)
}

const User = mongoose.model('User', UserSchema);
module.exports = User;