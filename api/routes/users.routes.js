import joi from "joi";
import { Router } from "express";
import { db } from "../../index.js";
import jwt from "jsonwebtoken";
import { statEmitter } from "../../index.js";
import {
  validateBody,
  validateParams,
} from "../../middleware/validator/validator.js";

const router = Router();

router.get("/:id", validateParams("usersId"), (req, res) => {
  try {
    db("user")
      .where("id", req.params.id)
      .returning("*")
      .then(([result]) => {
        if (!result) {
          res.status(404).send({ error: "User not found" });
          return;
        }
        return res.send({
          ...result,
        });
      });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
    return;
  }
});

router.post("/", validateBody("users"), (req, res) => {
  req.body.balance = 0;

  console.log(req.body);
  db("user")
    .insert(req.body)
    .returning("*")
    .then(([result]) => {
      result.createdAt = result.created_at;
      delete result.created_at;
      result.updatedAt = result.updated_at;
      delete result.updated_at;
      console.log(result);
      token = jwt.sign(
        { id: result.id, type: result.type },
        process.env.JWT_SECRET
      );
      console.log(token);
      statEmitter.emit("newUser");
      return res.send({
        ...result,
        accessToken: jwt.sign(
          { id: result.id, type: result.type },
          process.env.JWT_SECRET
        ),
      });
    })
    .catch((err) => {
      if (err.code == "23505") {
        res.status(400).send({
          error: err.detail,
        });
        return;
      }
      res.status(500).send("Internal Server Error");
      return;
    });
});

router.put("/:id", (req, res) => {
  let token = req.headers["authorization"];
  let tokenPayload;
  if (!token) {
    return res.status(401).send({ error: "Not Authorized" });
  }
  token = token.replace("Bearer ", "");
  try {
    tokenPayload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).send({ error: "Not Authorized" });
  }
  var schema = joi
    .object({
      email: joi.string().email(),
      phone: joi.string().pattern(/^\+?3?8?(0\d{9})$/),
      name: joi.string(),
      city: joi.string(),
    })
    .required();
  var isValidResult = schema.validate(req.body);
  if (isValidResult.error) {
    res.status(400).send({ error: isValidResult.error.details[0].message });
    return;
  }
  if (req.params.id !== tokenPayload.id) {
    return res.status(401).send({ error: "UserId mismatch" });
  }
  db("user")
    .where("id", req.params.id)
    .update(req.body)
    .returning("*")
    .then(([result]) => {
      return res.send({
        ...result,
      });
    })
    .catch((err) => {
      if (err.code == "23505") {
        console.log(err);
        res.status(400).send({
          error: err.detail,
        });
        return;
      }
      console.log(err);
      res.status(500).send("Internal Server Error");
      return;
    });
});

export default router;
