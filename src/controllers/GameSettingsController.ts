import { Request, Response, NextFunction, Router } from 'express';
import { Controller } from '../interfaces';
import { GameSettings, findGameSettingsByGameId } from '../models';
import { FETCH_ERROR, SAVE_ERROR, DELETE_ERROR, userRoles } from '../constants';
import { emitGameSettings } from '../socket';


class GameSettingsController implements Controller {
    public path = '/settings';
    public router = Router();
    private gameSettings = GameSettings;

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router
          .get(`${this.path}/:gameId`, this.getSettings)
          .post(`${this.path}/:gameId`, this.addSettings)
      }

    private getSettings = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const { gameId } = req.params;
            const gameSettings = await this.gameSettings.findOne({ gameId }).exec();

            if(!gameSettings) {
                throw new Error(FETCH_ERROR);
            }

            res.send(gameSettings);
        } catch(err) {
            next(err);
        }
    }

    private addSettings = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const { gameId } = req.params;
            const {userId, settings: gameSettingsData} = req.body;
            const presenceSettCurrentGame = await this.gameSettings.find({ gameId }).exec();
            if (presenceSettCurrentGame.length === 0) {
               const gameSettings = new this.gameSettings({ ...gameSettingsData, gameId });
               const savedSettings = await gameSettings.save();
               if(!savedSettings) {
                 throw new Error(SAVE_ERROR);
               }
            }
            emitGameSettings(userId, gameId, gameSettingsData)
            res.send(gameSettingsData);
        } catch (err) {
          next(err);
        }
    }

}

export { GameSettingsController }