Physics.behavior('edge-collision-detection', function( parent ){

    var PUBSUB_COLLISION = 'collisions:detected';

    // dummy body
    var checkGeneral = function checkGeneral( body, bounds, dummy ){

        var overlap
            ,aabb = body.aabb()
            ,scratch = Physics.scratchpad()
            ,trans = scratch.transform()
            ,dir = scratch.vector()
            ,result = scratch.vector()
            ,collision = false
            ,collisions = []
            ;

        // right
        overlap = (aabb.pos.x + aabb.x) - bounds.max.x;

        if ( overlap >= 0 ){

            dir.set( 1, 0 ).rotateInv( trans.setRotation( body.state.angular.pos ) );

            collision = {
                bodyA: body,
                bodyB: dummy,
                overlap: overlap,
                norm: {
                    x: 1,
                    y: 0
                },
                mtv: {
                    x: overlap,
                    y: 0
                },
                pos: body.geometry.getFarthestHullPoint( dir, result ).rotate( trans ).values()
            };

            collisions.push(collision);
        }

        // bottom
        overlap = (aabb.pos.y + aabb.y) - bounds.max.y;

        if ( overlap >= 0 ){

            dir.set( 0, 1 ).rotateInv( trans.setRotation( body.state.angular.pos ) );

            collision = {
                bodyA: body,
                bodyB: dummy,
                overlap: overlap,
                norm: {
                    x: 0,
                    y: 1
                },
                mtv: {
                    x: 0,
                    y: overlap
                },
                pos: body.geometry.getFarthestHullPoint( dir, result ).rotate( trans ).values()
            };

            collisions.push(collision);
        }

        // left
        overlap = bounds.min.x - (aabb.pos.x - aabb.x)

        if ( overlap >= 0 ){

            dir.set( -1, 0 ).rotateInv( trans.setRotation( body.state.angular.pos ) );

            collision = {
                bodyA: body,
                bodyB: dummy,
                overlap: overlap,
                norm: {
                    x: -1,
                    y: 0
                },
                mtv: {
                    x: -overlap,
                    y: 0
                },
                pos: body.geometry.getFarthestHullPoint( dir, result ).rotate( trans ).values()
            };

            collisions.push(collision);
        }

        // top
        overlap = bounds.min.y - (aabb.pos.y - aabb.y);

        if ( overlap >= 0 ){

            dir.set( 0, -1 ).rotateInv( trans.setRotation( body.state.angular.pos ) );

            collision = {
                bodyA: body,
                bodyB: dummy,
                overlap: overlap,
                norm: {
                    x: 0,
                    y: -1
                },
                mtv: {
                    x: 0,
                    y: -overlap
                },
                pos: body.geometry.getFarthestHullPoint( dir, result ).rotate( trans ).values()
            };

            collisions.push(collision);
        }

        scratch.done();
        return collisions;
    };

    var checkEdgeCollide = function checkEdgeCollide( body, bounds, dummy ){

        return checkGeneral( body, bounds, dummy );
    };

    var defaults = {

        aabb: null,
        restitution: 0.99,
        cof: 1.0
    };

    return {

        priority: 12,

        init: function( options ){

            parent.init.call(this, options);

            this.options = Physics.util.extend({}, this.options, defaults, options);

            this.setAABB( options.aabb );
            this.restitution = options.restitution;
            
            this._dummy = Physics.body('point', { 
                fixed: true,
                restitution: this.options.restitution,
                cof: this.options.cof
            });
        },

        setAABB: function( aabb ){

            if (!aabb) {
                throw 'Error: aabb not set';
            }

            aabb = aabb.get && aabb.get() || aabb;

            this._edges = {
                min: {
                    x: (aabb.pos.x - aabb.x),
                    y: (aabb.pos.y - aabb.y)
                },
                max: {
                    x: (aabb.pos.x + aabb.x),
                    y: (aabb.pos.y + aabb.y)  
                }
            };
        },

        connect: function( world ){

            world.subscribe( 'integrate:velocities', this.checkAll, this );
        },

        disconnect: function( world ){

            world.unsubscribe( 'integrate:velocities', this.checkAll );
        },

        checkAll: function( data ){
            
            var bodies = data.bodies
                ,dt = data.dt
                ,body
                ,collisions = []
                ,ret
                ,bounds = this._edges
                ,dummy = this._dummy
                ;

            for ( var i = 0, l = bodies.length; i < l; i++ ){

                body = bodies[ i ];

                // don't detect fixed bodies
                if ( !body.fixed ){
                    
                    ret = checkEdgeCollide( body, bounds, dummy );

                    if ( ret ){
                        collisions.push.apply( collisions, ret );
                    }
                }
            }

            if ( collisions.length ){

                this._world.publish({
                    topic: PUBSUB_COLLISION,
                    collisions: collisions
                });
            }
        },

        behave: function(){}
    };

});