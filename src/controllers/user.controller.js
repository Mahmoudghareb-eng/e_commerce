const User = require("../model/user.model");
const AppError = require("../middleware/error.middleware");

// GET ME
const getMe = async (req, res, next) => {
  try {
    const id = req.user.id;

    const user = await User.getUserById(id);

    if (!user) {
      throw new AppError("User not found",404);
    }

    res.status(200).json({ user });

  } catch (err) {
    next(err);
  }
};


// UPDATE PROFILE
const updateProfile = async (req, res, next) => {
  try {
    const id = req.user.id;

    const { name, email } = req.body;

    const user = await User.getUserById(id);

    if (!user) {
      throw new AppError("User not found",404);
    }

    const updatedUser = await User.updateUser(
      id,
      name || user.name,
      email || user.email
    );

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser
    });

  } catch (err) {
    next(err);
  }
};


// DELETE USER
const deleteUser = async (req, res, next) => {
  try {
    const id = req.user.id;

    const user = await User.getUserById(id);

    if (!user) {
      throw new AppError("User not found",404);
    }

    await User.deleteUser(id);

    res.status(200).json({
      message: "User deleted successfully"
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMe,
  updateProfile,
  deleteUser
};