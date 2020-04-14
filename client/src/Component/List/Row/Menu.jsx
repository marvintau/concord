import React from "react";

const Menu = props => {
  const {
    bindMenu,
    data,
    bindMenuItem,
    setClickedCmd,
    hideMenu
  } = props;

  const handleMenuItemClick = () => {
    console.log(data);
    hideMenu();
  };
  return (
    <div {...bindMenu} className="menu">
      <h1>Yo!</h1>
      <hr />
      <p {...bindMenuItem} onClick={handleMenuItemClick}>
        Second command
      </p>
    </div>
  );
};

export default Menu;
