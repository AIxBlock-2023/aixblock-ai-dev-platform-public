import {useLocation, useNavigate} from "react-router-dom";
import React, {ReactNode, useCallback, useEffect, useMemo, useRef, useState} from "react";
import Button from "../components/Button/Button";
import { useAuth } from "@/providers/AuthProvider";
import { useApi } from "@/providers/ApiProvider";
// import SignupRoles, { ROLE } from "./SignupRoles";
import "./Signup.scss";
import {createAlert, createAlertInfo} from "@/utils/createAlert";
import Select from "../components/Select/Select";
import WhatCanYouDo from "../components/WhatCanYouDo/WhatCanYouDo";

export const SIGN_UP = "SIGN_UP";
export const ROLES = "ROLES";
export const ROLE_OPTIONS = [
  {label: "AI Developer & AI Adopter", value: "2"},
  {label: "Compute supplier", value: "1"},
  // {label: "AI/ML model seller", value: "3"},
  {label: "Labeler", value: "4"},
  {label: "Automation Workflow Builder or Seller", value: "5"},
];

export default function Signup() {
  const navigate = useNavigate();
  const api = useApi();
  const auth = useAuth();
  const [error, setError] = useState<{ [k: string]: string[] } | string | null>(null);
  const [data, setData] = useState({ first_name: "", email: "", pass: "" });
  const { first_name, email, pass } = data;
  // const [page, setPage] = useState<typeof SIGN_UP | typeof ROLES>(SIGN_UP);
  const [role, setRole] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const emailCheckResult = useRef<{[k: string]: boolean}>({});
  const {search} = useLocation();
  const params = React.useMemo(() => new URLSearchParams(search), [search]);

  useEffect(() => {
    setError(auth.errorSignup);
  }, [auth.errorSignup]);

  // useEffect(() => {
  //   error && setPage(SIGN_UP);
  // }, [error]);

  const isDataValid = useMemo(() => {
    return first_name && first_name.trim().length > 0
      && email && email.trim().length > 0
      && pass && pass.length > 0
      && !!role;
  }, [email, first_name, pass, role]);

  const handleSubmit = () => {
    if (!role) {
      setError("Please select a role");
      return;
    }

    const abortController = new AbortController();
    auth
      .signup(
        {
          first_name: first_name.trim(),
          email: email.trim().toLowerCase(),
          password: pass,
          role,
          csrfmiddlewaretoken: api.getCsrfToken(),
        },
        abortController
    )
      .then(() => {
        localStorage.setItem('isSignUpSuccess', 'true');
        const queries = new URLSearchParams(window.location.search);
        const nextUrl = queries.get("next");

        if (nextUrl) {
          window.location.href = nextUrl;
        }
      })
      .finally(() => {
        if (abortController.signal.aborted) {
          localStorage.removeItem('isSignUpSuccess');
          return;
        }
      });
    return () => {
      abortController.abort();
    };
  };
/*
  const handleSignupGoogle = () => {
    auth.loginWithGoogle();
  };
*/
  const errorNode = useMemo(() => {
    if (error && typeof error === "string") {
      return createAlert(error, undefined, false, {marginBottom: 16});
    }

    if (error && typeof error === "object") {
      const msg: ReactNode[] = [];
      const fields = Object.keys(error);

      for (let i = 0; i < fields.length; i++) {
        const name = fields[i];

        if (!Array.isArray(error[name]) || error[name].length === 0) {
          continue;
        }

        msg.push(<div style={{marginBottom: 8}}><strong>{name.toUpperCaseFirst()}</strong>: {error[name][0]}</div>)
      }

      return createAlert(msg, undefined, false, {marginBottom: 16});
    }

    return null;
  }, [error]);

  const validateEmail = useCallback((onValid: () => void) => {
    setError(null);

    if (emailCheckResult.current.hasOwnProperty(email)) {
      if (emailCheckResult.current[email]) {
        onValid();
      } else {
        setError({"email": ["Your email address is not valid"]});
      }

      return;
    }

    setIsChecking(true);

    const ar = api.call("validateEmail", {
      body: {email},
    });

    ar.promise
      .then(async r => {
        if (r.ok) {
          const data = await r.json();

          if (!data["has_error"] && !data["is_valid"]) {
            setError({"email": ["Your email address is not valid"]});
            emailCheckResult.current[email] = false;
            return;
          }
        }

        // setPage(ROLES);
        emailCheckResult.current[email] = true;
        onValid();
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [api, email]);

  const checkingMessage = useMemo(() => {
    if (!isChecking) {
      return null;
    }

    return createAlertInfo("Checking information...", false, {marginBottom: 16});
  }, [isChecking]);

  const roleOption = useMemo(() => {
    return ROLE_OPTIONS.find(o => Number(o.value) === role) ?? {label: "Select a role", value: ""};
  }, [role]);

  return /*page === SIGN_UP ? */(
    <div className="sign-up">
      <div className="sign-up-left">
        <div className="sign-up-left-content">
          <img src={require("../assets/images/logo.png")} alt="Logo"/>
          <span className="sign-up-left-text">
            The first MCP-native platform for<br/>
            AI model development & workflow automation
          </span>
          <div style={{marginTop: 72, marginBottom: 48}}>
            <WhatCanYouDo/>
          </div>
          <div style={{textAlign: "center"}}>
            <small>Powerful AI development meets automation workflows — with 90% lower compute costs.</small>
          </div>
        </div>
      </div>
      <div className="sign-up-right">
        <div className="sign-up-content">
          <div className="sign-up-content__title">Sign Up</div>
          {errorNode}
          {checkingMessage}
          <div className="sign-up-content__input">
            <input
              type="text"
              placeholder="Name"
              className="first_name"
              value={first_name}
              onChange={(event) =>
                setData({ ...data, first_name: event.target.value })
              }
              disabled={isChecking}
            />
            <input
              type="email"
              placeholder="Email"
              className="email"
              value={email}
              onChange={(event) =>
                setData({ ...data, email: event.target.value.trim().toLowerCase() })
              }
              disabled={isChecking}
            />
            <input
              type="password"
              placeholder="Password"
              className="password"
              value={pass}
              onChange={(event) => setData({ ...data, pass: event.target.value })}
              disabled={isChecking}
            />
            <Select
              className="role"
              data={[{
                options: ROLE_OPTIONS,
              }]}
              defaultValue={roleOption}
              isLoading={isChecking}
              onChange={e => setRole(Number(e.value))}
            />
          </div>
          <div className="sign-up-content__group-btn">
            <Button
              type="white"
              onClick={() => navigate("/user/login/?" + params.toString())}
              disabled={isChecking}
            >
              Sign In
            </Button>
            <Button
              type="gradient"
              disabled={isChecking || !isDataValid}
              onClick={() => validateEmail(handleSubmit)}
            >
              Sign Up
            </Button>
          </div>
          {/* <div className="sign-up-content__or">Or</div>
          <Button
            type="white"
            size="large"
            className="signup-google"
            onClick={handleSignupGoogle}
          >
            <img
              src={require("../assets/images/icon_google.png")}
              alt="icon google"
            />
            Sign Up With Google
          </Button> */}
        </div>
      </div>
    </div>
  ) /*: (
    <SignupRoles
        role={role}
        onChange={setRole}
        setPage={setPage}
        onSubmit={handleSubmit}
      />
  )*/;
}
