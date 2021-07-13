import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Container } from "../../styled";

const index = ({ children }) => {
  return (
    <div>
      <Header />
      <Container direction="column" height="83vh" background="#EDF8DF">
        {children}
      </Container>
      <Footer />
    </div>
  );
};
export default index;