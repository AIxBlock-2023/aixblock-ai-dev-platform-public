import React from "react";
import {useLocation, useNavigate} from "react-router-dom";
import Button from "../components/Button/Button";
import { useApi } from "@/providers/ApiProvider";
import { useAuth } from "@/providers/AuthProvider";
import { createAlert } from "@/utils/createAlert";
import "./Signup.scss";
import WhatCanYouDo from "../components/WhatCanYouDo/WhatCanYouDo";

export default function Login() {
  const api = useApi();
  const auth = useAuth();
  const navigate = useNavigate();
  const [isSubmit, setSubmit] = React.useState(false);
  const {search} = useLocation();
  const params = React.useMemo(() => new URLSearchParams(search), [search]);
  const [form] = React.useState<{ [k: string]: string }>({
    email: "",
    password: "",
  });

  function handleInput(ev: React.FormEvent<HTMLInputElement>, name: string) {
    form[name] = ev.currentTarget.value;
  }

  const handleResetPassword = () => {
    navigate("/user/reset-password");
  };

  const handleGoogleLogin = () => {
    auth.loginWithGoogle().then(() => {
      // redirect after auth
    });
  };

  React.useEffect(() => {
    if (!isSubmit) {
      return;
    }

    const abortController = new AbortController();

    auth
      .login(
        {
          email: form.email.trim().toLowerCase(),
          password: form.password,
          csrfmiddlewaretoken: api.getCsrfToken(),
        },
        abortController
      )
      .finally(() => {
        if (abortController.signal.aborted) {
          return;
        }

        setSubmit(false);
      });

    return () => {
      setSubmit(false);
      abortController.abort();
    };
    // eslint-disable-next-line
  }, [isSubmit]);

  const errorNode = React.useMemo(() => {
    return createAlert(auth.error, undefined, false, { marginBottom: 16 });
  }, [auth.error]);

  const errorValidationNode = React.useMemo(() => {
    if (!auth.errors["__all__"] || auth.errors["__all__"].length === 0) {
      return null;
    }

    return createAlert(auth.errors["__all__"][0], undefined, false, {
      marginBottom: 16,
    });
  }, [auth.errors]);

  return (
    <div className="sign-up">
      <div className="sign-up-left">
        <div className="sign-up-left-content">
          <img src={require("../assets/images/logo.png")} alt="Logo" />
          <span className="sign-up-left-text">
            The first MCP-native platform for<br/>
            AI model development & workflow automation
          </span>
          <div style={{marginTop: 72, marginBottom: 48}}>
            <WhatCanYouDo />
          </div>
          <div style={{textAlign: "center"}}>
            <small>Powerful AI development meets automation workflows — with 90% lower compute costs.</small>
          </div>
        </div>
      </div>
      <div className="sign-up-right">
        <div className="sign-up-content">
          <div className="sign-up-content__title">Sign In</div>
          {errorNode}
          {errorValidationNode}
          <div className="sign-up-content__input">
            <input
              className="email"
              placeholder="Email"
              onChange={(ev) => handleInput(ev, "email")}
              disabled={isSubmit}
            />
            <input
              type="password"
              className="password"
              placeholder="Password"
              onChange={(ev) => handleInput(ev, "password")}
              disabled={isSubmit}
            />
          </div>
          <div className="sign-up-content__group-btn">
            <Button type="white" onClick={() => navigate("/user/signup/?" + params.toString())}>
              Sign Up
            </Button>
            <Button
              htmlType="submit"
              type="gradient"
              onClick={() => setSubmit(true)}
            >
              Sign In
            </Button>
          </div>
          <div
            //todo: remove when update new design
            style={{
              fontSize: 14,
              marginTop: 16,
              cursor: "pointer",
            }}
            onClick={handleResetPassword}
          >
            Reset your password ?
          </div>
          <div className="sign-up-content__or">Or</div>
          <Button
            type="white"
            className="signup-google"
            onClick={handleGoogleLogin}
          >
            <img
              src={require("../assets/images/icon_google.png")}
              alt="icon google"
            />
            Sign In With Google
          </Button>
        </div>
      </div>
    </div>
  );
}
