import { useAtom } from "jotai";
import { answerAtom } from "../store/gameAtoms";

export const useAnswer = () => {
  const [answer, setAnswer] = useAtom(answerAtom);

  const clearAnswer = () => setAnswer("");

  return {
    answer,
    setAnswer,
    clearAnswer,
  };
};

