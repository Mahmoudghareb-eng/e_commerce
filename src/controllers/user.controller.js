const User = require("../model/user.model");

// GET ME
const getMe = async (req, res) => {
  try {
    const id = req.user.id;

    const user = await User.getUserById(id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json({ user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};


// UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {
    const id = req.user.id;

    const { name, email } = req.body;

    const user = await User.getUserById(id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
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
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};


// DELETE USER
const deleteUser = async (req, res) => {
  try {
    const id = req.user.id;

    const user = await User.getUserById(id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    await User.deleteUser(id);

    res.status(200).json({
      message: "User deleted successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  getMe,
  updateProfile,
  deleteUser
};