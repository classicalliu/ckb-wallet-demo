import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import bodyParser from "body-parser";
import expressJwt from "express-jwt";

import { JWT_SECRET_KEY } from "./models/account";

import indexRouter from "./routes/index";
import usersRouter from "./routes/users";
import accountsRouter from "./routes/accounts";

let app = express();

// view engine setup
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  expressJwt({
    secret: JWT_SECRET_KEY,
    algorithms: ["HS256"],
  }).unless({
    path: ["/accounts/login", "/accounts"],
  })
);

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/accounts", accountsRouter);

// catch 404 and forward to error handler
app.use((_req, _res, next) => {
  next(createError(404));
});

// error handler
app.use((err: any, req: any, res: any, _next: any) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  // res.render("error");
  res.json(err);
});

export default app;
