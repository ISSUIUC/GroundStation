export function ShowPath({path, children}) {
  const win_pathname = window.location.pathname;

  if(win_pathname.startsWith(path)) {
    return children;
  } else {
    return <></>
  }

}

export function ShowPathExact({path, children}) {
    const win_pathname = window.location.pathname;
    if(path === win_pathname) {
      return children;
    } else {
      return <></>
    }
  
  }

export function ShowIf({condition, children}) {
  if(condition) {
    return children;
  } else {
    return <></>;
  }
}