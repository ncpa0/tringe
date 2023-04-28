/** Gets all the prototypes in the prototype chain of an object. */
export const getProtoChain = (initProto: any) => {
  const chain = [];
  let proto = initProto;
  while (proto !== Object.prototype && proto !== null) {
    chain.push(proto);
    proto = Object.getPrototypeOf(proto);
  }
  return chain.reverse();
};
