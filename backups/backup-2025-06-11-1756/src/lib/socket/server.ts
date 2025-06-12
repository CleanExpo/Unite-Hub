const socketHandler = (req: any, res: any) => {
  res.status(200).json({ connected: true });
};
export default socketHandler;
